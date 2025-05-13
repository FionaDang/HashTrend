import json
import os
from collections import Counter, defaultdict
from datetime import datetime

# ─── 1) Load scraped data ─────────────────────────────────────────────────────
def load_scraped(path='data/scraped_data.json'):
    if not os.path.exists(path):
        print(f"🔴 No scraped data found at {path}")
        return []
    with open(path, encoding='utf-8') as f:
        return json.load(f)

# ─── 2) Extract hashtags ─────────────────────────────────────────────────────
def extract_hashtags(caption: str):
    if not caption:
        return []
    return [word.strip('#.,!?:;').lower()
            for word in caption.split()
            if word.startswith('#')]

# ─── 3) Bucket into 5-minute windows ─────────────────────────────────────────
def bucket_posts_by_window(posts, window_minutes=5):
    buckets = defaultdict(list)
    for p in posts:
        ts = p.get('createdTime') or p.get('created_time') or p.get('timestamp')
        if not ts:
            continue
        dt = datetime.fromisoformat(ts.replace('Z', '+00:00'))
        minute = (dt.minute // window_minutes) * window_minutes
        bucket_time = dt.replace(minute=minute, second=0, microsecond=0)
        buckets[bucket_time].append(p)
    if not buckets:
        print("⚠️ No valid timestamps found in posts")
    return dict(sorted(buckets.items()))

# ─── 4) Compute top trends with fallback ───────────────────────────────────────
def compute_top_trends(buckets, top_n=2):
    times = sorted(buckets.keys())
    if not times:
        return {}

    # Always show volume for most recent bucket
    latest = times[-1]
    print(f"📅 Latest bucket at {latest.isoformat()}, {len(buckets[latest])} posts")

    # Count hashtags in latest bucket
    volume_counts = Counter()
    for post in buckets[latest]:
        tags = extract_hashtags(post.get('description','') or post.get('caption',''))
        if tags:
            print(f" - Post hashtags: {tags}")
        for tag in tags:
            volume_counts[tag] += 1

    if not volume_counts:
        print("⚠️ No hashtags found in latest bucket")
        return {}

    # If only one bucket, fall back to volume-only ranking
    if len(times) < 2:
        print("⚠️ Only one window available—ranking by volume only")
        top = {}
        for tag, vol in volume_counts.most_common(top_n):
            top[tag] = {
                'score': vol,
                'volume': vol,
                'velocity': None,
                'window_start': latest.isoformat()
            }
        return top

    # Otherwise compute velocity against previous bucket
    prev = times[-2]
    prev_counts = Counter()
    for post in buckets[prev]:
        for tag in extract_hashtags(post.get('description','') or post.get('caption','')):
            prev_counts[tag] += 1

    trend_scores = {}
    for tag, vol in volume_counts.items():
        prev_vol = prev_counts.get(tag, 0)
        velocity = (vol - prev_vol) / prev_vol if prev_vol>0 else vol
        score = vol * 0.7 + velocity * 0.3
        trend_scores[tag] = {
            'score': round(score,3),
            'volume': vol,
            'velocity': round(velocity,3),
            'window_start': latest.isoformat()
        }

    top = dict(sorted(trend_scores.items(),
                      key=lambda kv: kv[1]['score'],
                      reverse=True)[:top_n])
    return top

# ─── 5) CLI Entrypoint ─────────────────────────────────────────────────────────
if __name__ == "__main__":
    posts = load_scraped()
    if not posts:
        exit()

    buckets = bucket_posts_by_window(posts, window_minutes=5)
    top_trends = compute_top_trends(buckets, top_n=2)

    print("\n📈 Top 2 Trends:")
    if not top_trends:
        print("  (none found)")
    else:
        for tag, stats in top_trends.items():
            vel = stats['velocity'] if stats['velocity'] is not None else "N/A"
            print(f"  #{tag} → score={stats['score']}  vol={stats['volume']}  vel={vel}  window={stats['window_start']}")
