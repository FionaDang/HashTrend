import os
import sys
import re
import time
import json
import traceback
import requests
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from io import BytesIO
from dotenv import load_dotenv
from pydantic import BaseModel
from huggingface_hub import InferenceClient
from sentence_transformers import SentenceTransformer, util
from concurrent.futures import ThreadPoolExecutor
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
# ─── Load Local Modules ───────────────────────────────────────────────
from src.apify_scraper import run_and_fetch_sync
from src.trend_analysis import compute_tf_idf_trends

# ─── Load Hugging Face Token ───────────────────────────────────────────
load_dotenv()
HF_TOKEN = os.getenv("HF_TOKEN")
if not HF_TOKEN:
    raise ValueError("❌ HF_TOKEN missing in .env")

client = InferenceClient(
    model="meta-llama/Meta-Llama-3-8B-Instruct",
    token=HF_TOKEN
)

# ─── App Setup ─────────────────────────────────────────────────────────
app = Flask(__name__)
CORS(app, origins="*", methods=["GET", "POST"], allow_headers="*")

# ─── Keyword Extraction ───────────────────────────────────────────────
class KeywordResult(BaseModel):
    keywords: list[str]

def extract_keywords_llama(prompt: str, max_keywords: int = 3) -> KeywordResult:
    full_prompt = (
        f"You are an assistant. Extract {max_keywords} relevant keywords from the product description below.\n"
        f"Respond only with a comma-separated list.\n\n"
        f"Description: \"{prompt}\"\nKeywords:"
    )
    try:
        response = client.text_generation(prompt=full_prompt, max_new_tokens=40, temperature=0.7)
        text = response.strip()
        print("🧪 Raw keyword response:", repr(text))
        return KeywordResult(keywords=[k.strip().lower() for k in text.split(",") if k.strip()])
    except Exception as e:
        print("❌ Keyword extraction error:", e)
        traceback.print_exc()
        return KeywordResult(keywords=[])

# ─── Strategy Suggestions ─────────────────────────────────────────────
def generate_suggestions(prompt: str, keywords: list[str], trends: list[str], max_suggestions: int = 3) -> list[str]:
    summary = ", ".join(f"#{tag}" for tag in trends)
    full_prompt = (
        f"My content is about: {prompt}. "
        f"The extracted keywords are: {', '.join(keywords)}. "
        f"The trending hashtags are: {summary}. "
        f"Give {max_suggestions} short and clear strategic tips for making content that performs well in this niche. "
        f"Respond as a list without explanations."
    )
    try:
        response = client.text_generation(prompt=full_prompt, max_new_tokens=120, temperature=0.7)
        return [line.strip("•- ") for line in response.strip().split("\n") if line]
    except Exception as e:
        print("❌ Suggestion generation error:", e)
        traceback.print_exc()
        return []

# ─── Helpers ──────────────────────────────────────────────────────────
def sanitize_hashtag(tag: str) -> str:
    return re.sub(r'[^a-zA-Z0-9_]', '', tag)

def run_and_fetch_cached(hashtag):
    path = f"data/{hashtag}.json"
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)

    posts = run_and_fetch_sync(hashtag)
    if posts:
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(posts, f, ensure_ascii=False, indent=2)
    return posts or []

def fetch_all_keywords_parallel(keywords):
    all_posts = []
    with ThreadPoolExecutor(max_workers=min(5, len(keywords))) as executor:
        futures = [executor.submit(run_and_fetch_cached, sanitize_hashtag(kw)) for kw in keywords]
        for f in futures:
            posts = f.result()
            if posts:
                all_posts.extend(posts)
    return all_posts

def filter_irrelevant_trends(prompt, trends_dict, keywords, similarity_threshold=0.15, debug=True):
    model = SentenceTransformer('all-MiniLM-L6-v2')
    prompt_embedding = model.encode(prompt, convert_to_tensor=True)
    filtered = {}
    keywords = [kw.lower() for kw in keywords]
    for tag, stats in trends_dict.items():
        tag_text = tag.lower()
        if any(kw in tag_text for kw in keywords):
            if debug:
                print(f"✅ Keeping #{tag} (matched keyword)")
            filtered[tag] = stats
            continue
        tag_embedding = model.encode(tag_text, convert_to_tensor=True)
        similarity = float(util.cos_sim(prompt_embedding, tag_embedding))
        if debug:
            print(f"🔍 #{tag.ljust(20)} → similarity: {similarity:.2f}")
        if similarity >= similarity_threshold:
            filtered[tag] = stats
    return filtered

# ─── API Routes ───────────────────────────────────────────────────────
@app.route("/analyze", methods=["POST"])
def analyze():
    try:
        prompt = request.json.get("prompt", "")
        if not prompt:
            return jsonify({"error": "Missing prompt"}), 400

        t0 = time.time()
        keyword_result = extract_keywords_llama(prompt)
        keywords = keyword_result.keywords
        print(f"⏱️ Keyword extraction took {time.time() - t0:.2f}s")

        if not keywords:
            return jsonify({"error": "No keywords extracted"}), 500

        t1 = time.time()
        all_posts = fetch_all_keywords_parallel(keywords)
        print(f"⏱️ Scraping took {time.time() - t1:.2f}s")

        if not all_posts:
            return jsonify({"error": "No posts found"}), 404

        t2 = time.time()
        raw_trends = compute_tf_idf_trends(all_posts, top_n=15)
        trends = filter_irrelevant_trends(prompt, raw_trends, keywords=keywords, similarity_threshold=0.2)
        final_trends = dict(list(trends.items())[:5])
        print(f"⏱️ Trend analysis took {time.time() - t2:.2f}s")

        suggestions = generate_suggestions(prompt, keywords, list(final_trends.keys()))

        return jsonify({
            "keywords": keywords,
            "trends": final_trends,
            "suggestions": suggestions
        })

    except Exception as e:
        print("❌ Error in /analyze:", e)
        traceback.print_exc()
        return jsonify({"error": "Internal server error"}), 500

@app.route("/proxy-image")
def proxy_image():
    url = request.args.get("url")
    print(f"🔍 Proxying image: {url}")
    try:
        resp = requests.get(
            url,
            headers={
                "User-Agent": "Mozilla/5.0",
                "Referer": "https://www.instagram.com/",
            },
            timeout=5
        )
        if resp.status_code == 200 and "image" in resp.headers.get("Content-Type", ""):
            return send_file(BytesIO(resp.content), mimetype=resp.headers["Content-Type"])
    except Exception as e:
        print("❌ Image proxy failed:", e)
    return '', 404

@app.route("/hashtag/<tag>", methods=["GET"])
def get_hashtag_posts(tag):
    try:
        clean_tag = sanitize_hashtag(tag)
        posts = run_and_fetch_cached(clean_tag)

        if not posts:
            return jsonify({"posts": []})

        sorted_posts = sorted(
            posts,
            key=lambda p: (p.get("likes", 0) + p.get("comments", 0)),
            reverse=True
        )

        formatted = [{
            "username": post.get("ownerUsername") or post.get("author") or "unknown",
            "avatarUrl": post.get("profilePicUrl") or "",
            "caption": post.get("description") or post.get("text") or "",
            "imageUrl": post.get("displayUrl") or "",
            "likes": post.get("likes") or 0,
            "comments": post.get("comments") or 0,
            "timestamp": post.get("timestamp") or "",
            "url": post.get("url") or "",
        } for post in sorted_posts[:6]]

        return jsonify({"posts": formatted})

    except Exception as e:
        print("❌ Error in /hashtag/<tag>:", e)
        traceback.print_exc()
        return jsonify({"error": "Failed to fetch posts"}), 500

# ─── Entrypoint ────────────────────────────────────────────────────────
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
