import os
import re
import time
import traceback
from typing import List
from dotenv import load_dotenv
from pydantic import BaseModel
from huggingface_hub import InferenceClient
from apify_scraper import run_and_fetch_sync
from trend_analysis import compute_tf_idf_trends
from sentence_transformers import SentenceTransformer, util
from concurrent.futures import ThreadPoolExecutor
import json

# ─── Load Hugging Face Token ───────────────────────────────────────────
load_dotenv()
HF_TOKEN = os.getenv("HF_TOKEN")
if not HF_TOKEN:
    raise ValueError("❌ HF_TOKEN missing in .env")

# ─── Inference Client: Llama3 on hf-inference ────────────────────
client = InferenceClient(
    model="meta-llama/Meta-Llama-3-8B-Instruct",
    token=HF_TOKEN
)

# ─── Keyword Result Model ──────────────────────────────────────────────
class KeywordResult(BaseModel):
    keywords: List[str]

# ─── Keyword Extractor Using Mixtral ───────────────────────────────────
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

# ─── Suggestion Generator Using Mixtral ────────────────────────────────
def generate_suggestions(prompt: str, keywords: List[str], trends: List[str], max_suggestions: int = 3) -> List[str]:
    trend_summary = ", ".join(f"#{t}" for t in trends)
    user_prompt = (
        f"My content is about: {prompt}. "
        f"The extracted keywords are: {', '.join(keywords)}. "
        f"The trending hashtags are: {trend_summary}. "
        f"Give {max_suggestions} short and clear strategic tips for making content that performs well in this niche. "
        f"Respond as a list without explanations."
    )

    try:
        response = client.text_generation(prompt=user_prompt, max_new_tokens=120, temperature=0.7)
        return [line.strip("•- ") for line in response.strip().split("\n") if line]
    except Exception as e:
        print("❌ Suggestion generation error:", e)
        traceback.print_exc()
        return []

# ─── Trend Relevance Filtering ─────────────────────────────────────────
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

# ─── Hashtag Sanitization ─────────────────────────────────────────────
def sanitize_hashtag(tag):
    return re.sub(r'[^a-zA-Z0-9_]', '', tag)

# ─── Caching + Scraping ───────────────────────────────────────────────
def run_and_fetch_cached(hashtag):
    path = f"data/{hashtag}.json"
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            print(f"🗂️ Loaded cached #{hashtag}")
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

# ─── Trend Finder Workflow ─────────────────────────────────────────────
class TrendFinder:
    def __init__(self, top_n=5):
        self.top_n = top_n

    def run(self):
        prompt = input("💬 Describe your product or post: ").strip()
        if not prompt:
            print("❌ No input provided.")
            return

        t0 = time.time()
        print("🤖 Extracting keywords using Mixtral...")
        keyword_result = extract_keywords_llama(prompt)
        print(f"⏱️ Keyword extraction took {time.time() - t0:.2f}s")
        keywords = keyword_result.keywords
        if not keywords:
            print("⚠️ No keywords extracted.")
            return
        print("🔑 Keywords:", ", ".join(keywords))

        t1 = time.time()
        all_posts = fetch_all_keywords_parallel(keywords)
        print(f"⏱️ Scraping took {time.time() - t1:.2f}s")
        if not all_posts:
            print("⚠️ No posts found.")
            return

        t2 = time.time()
        raw_trends = compute_tf_idf_trends(all_posts, top_n=15)
        trends = filter_irrelevant_trends(prompt, raw_trends, keywords=keywords, similarity_threshold=0.2)
        trends = dict(list(trends.items())[:self.top_n])
        print(f"⏱️ Trend analysis took {time.time() - t2:.2f}s")

        print("\n📈 Top Hashtag Trends:")
        if not trends:
            print("  (No relevant trends found)")
        else:
            for i, (tag, stats) in enumerate(trends.items(), 1):
                print(f" {i}. #{tag} (score={stats['score']}, vol={stats['volume']})")

        print("\n💡 Strategy Suggestions:")
        suggestions = generate_suggestions(prompt, keywords, list(trends.keys()))
        if suggestions:
            for i, tip in enumerate(suggestions, 1):
                print(f" {i}. {tip}")
        else:
            print("  (No suggestions generated)")

# ─── Entrypoint ────────────────────────────────────────────────────────
if __name__ == "__main__":
    TrendFinder().run()
