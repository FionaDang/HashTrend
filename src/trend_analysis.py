import json
import os
from collections import Counter, defaultdict
from typing import List
from datetime import datetime

# ─── Load scraped data ─────────────────────────────────────────────────────────
def load_scraped(path='data/scraped_data.json'):
    if not os.path.exists(path):
        print(f"🔴 No scraped data found at {path}")
        return []
    with open(path, encoding='utf-8') as f:
        return json.load(f)

# ─── Extract hashtags from captions ────────────────────────────────────────────
def extract_hashtags(caption: str) -> List[str]:
    if not caption:
        return []
    return [
        word.strip('#.,!?:;"\'').lower()
        for word in caption.split()
        if word.startswith('#')
    ]

# ─── Compute TF-IDF-like trending score ────────────────────────────────────────
def compute_tf_idf_trends(posts: List[dict], top_n=5):
    tag_frequency = Counter()
    doc_frequency = Counter()
    total_posts = 0

    for post in posts:
        total_posts += 1
        caption = post.get('caption') or post.get('description', '')
        tags = set(extract_hashtags(caption))
        for tag in tags:
            doc_frequency[tag] += 1
        for tag in extract_hashtags(caption):
            tag_frequency[tag] += 1

    avg_volume = sum(tag_frequency.values()) / (len(tag_frequency) or 1)

    trends = {}
    for tag in tag_frequency:
        tf = tag_frequency[tag]
        df = doc_frequency[tag]
        idf = max(1.0, total_posts / (df + 1))
        score = tf * idf
        trends[tag] = {
            'score': round(score, 2),
            'volume': tf,
            'velocity': None,  # Not applicable in TF-IDF mode
            'window_start': None  # Not used here
        }

    top = dict(sorted(trends.items(), key=lambda x: x[1]['score'], reverse=True)[:top_n])
    return top

# ─── CLI Entrypoint for testing ────────────────────────────────────────────────
if __name__ == "__main__":
    posts = load_scraped()
    if not posts:
        print("⚠️ No data to analyze.")
        exit()

    trends = compute_tf_idf_trends(posts, top_n=5)

    print("\n📈 Top Hashtag Trends (TF-IDF-style):")
    for tag, stats in trends.items():
        print(f"  #{tag} → score={stats['score']}  volume={stats['volume']}")
