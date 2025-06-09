import os
import traceback
from typing import List
from dotenv import load_dotenv
from pydantic import BaseModel
from huggingface_hub import InferenceClient
from apify_scraper import run_and_fetch_sync
from trend_analysis import bucket_posts_by_window, compute_top_trends
from sentence_transformers import SentenceTransformer, util

# ─── Load Hugging Face Token ───────────────────────────────────────────
load_dotenv()
HF_TOKEN = os.getenv("HF_TOKEN")
if not HF_TOKEN:
    raise ValueError("❌ HF_TOKEN missing in .env")

# ─── Hugging Face LLaMA 3 Chat Client ──────────────────────────────────
client = InferenceClient(
    model="meta-llama/Meta-Llama-3-8B-Instruct",
    token=HF_TOKEN
)

# ─── Keyword Result Model ──────────────────────────────────────────────
class KeywordResult(BaseModel):
    keywords: List[str]

# ─── Keyword Extractor Using LLaMA 3 ───────────────────────────────────
def extract_keywords_llama(prompt: str, max_keywords: int = 3) -> KeywordResult:
    system_msg = {
        "role": "system",
        "content": (
            f"You are an assistant. Extract {max_keywords} relevant keywords from a product description. "
            f"Respond only with a comma-separated list."
        )
    }
    user_msg = {
        "role": "user",
        "content": f"Description: \"{prompt}\"\nKeywords:"
    }

    try:
        resp = client.chat.completions.create(
            model=client.model,
            messages=[system_msg, user_msg],
            max_tokens=40,
            temperature=0.7
        )
        text = resp.choices[0].message.content.strip()
        print("🧪 Raw keyword response:", repr(text))
        return KeywordResult(keywords=[k.strip().lower() for k in text.split(",") if k.strip()])
    except Exception as e:
        print("❌ Keyword extraction error:", e)
        traceback.print_exc()
        return KeywordResult(keywords=[])

# ─── Trend Relevance Filtering ─────────────────────────────────────────
def filter_irrelevant_trends(prompt, trends_dict, keywords, similarity_threshold=0.15, debug=True):
    model = SentenceTransformer('all-MiniLM-L6-v2')
    prompt_embedding = model.encode(prompt, convert_to_tensor=True)
    filtered = {}

    # Normalize keywords
    keywords = [kw.lower() for kw in keywords]

    for tag, stats in trends_dict.items():
        tag_text = tag.lower()

        # Force-include if tag contains a keyword
        if any(kw in tag_text for kw in keywords):
            if debug:
                print(f"✅ Keeping #{tag} (matched keyword)")
            filtered[tag] = stats
            continue

        # Else use semantic similarity
        tag_embedding = model.encode(tag_text, convert_to_tensor=True)
        similarity = float(util.cos_sim(prompt_embedding, tag_embedding))

        if debug:
            print(f"🔍 #{tag.ljust(20)} → similarity: {similarity:.2f}")

        if similarity >= similarity_threshold:
            filtered[tag] = stats

    return filtered

# ─── Trend Finder Workflow ─────────────────────────────────────────────
class TrendFinder:
    def __init__(self, window_minutes=60, top_n=5):
        self.window_minutes = window_minutes
        self.top_n = top_n

    def run(self):
        prompt = input("💬 Describe your product or post: ").strip()
        if not prompt:
            print("❌ No input provided.")
            return

        print("🤖 Extracting keywords using LLaMA 3...")
        keyword_result = extract_keywords_llama(prompt)
        keywords = keyword_result.keywords
        if not keywords:
            print("⚠️ No keywords extracted.")
            return
        print("🔑 Keywords:", ", ".join(keywords))

        all_posts = []
        for kw in keywords:
            print(f"🔍 Scraping posts for #{kw}...")
            posts = run_and_fetch_sync(kw)
            if posts:
                all_posts.extend(posts)

        if not all_posts:
            print("⚠️ No posts found for any keyword.")
            return

        print(f"📦 Scraped {len(all_posts)} posts. Analyzing trends...")
        buckets = bucket_posts_by_window(all_posts, window_minutes=self.window_minutes)
        raw_trends = compute_top_trends(buckets, top_n=15)  # buffer more to allow filtering
        trends = filter_irrelevant_trends(prompt, raw_trends, keywords=keywords, similarity_threshold=0.2)
        trends = dict(list(trends.items())[:self.top_n])  # top N after filtering

        print("\n📈 Top Hashtag Trends:")
        if not trends:
            print("  (No relevant trends found)")
        else:
            for i, (tag, stats) in enumerate(trends.items(), 1):
                vel = stats['velocity'] if stats['velocity'] is not None else "N/A"
                print(f" {i}. #{tag} (score={stats['score']}, vol={stats['volume']}, vel={vel})")

# ─── Entrypoint ────────────────────────────────────────────────────────
if __name__ == "__main__":
    TrendFinder().run()
