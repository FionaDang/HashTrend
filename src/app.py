from flask import Flask, request, jsonify
from flask_cors import CORS
from trend_analysis import bucket_posts_by_window, compute_top_trends
from apify_scraper import run_and_fetch_sync
from main import extract_keywords_llama, filter_irrelevant_trends

app = Flask(__name__)
CORS(app)  # allow cross-origin requests from React

@app.route("/analyze", methods=["POST"])
def analyze():
    data = request.get_json()
    prompt = data.get("prompt", "")

    if not prompt:
        return jsonify({"error": "Prompt required"}), 400

    keyword_result = extract_keywords_llama(prompt)
    keywords = keyword_result.keywords

    all_posts = []
    for kw in keywords:
        posts = run_and_fetch_sync(kw)
        if posts:
            all_posts.extend(posts)

    if not all_posts:
        return jsonify({"trends": [], "keywords": keywords})

    buckets = bucket_posts_by_window(all_posts, window_minutes=60)
    raw_trends = compute_top_trends(buckets, top_n=15)
    trends = filter_irrelevant_trends(prompt, raw_trends, keywords, similarity_threshold=0.15)
    top_trends = dict(list(trends.items())[:5])

    return jsonify({
        "keywords": keywords,
        "trends": [
            {"tag": tag, **stats}
            for tag, stats in top_trends.items()
        ]
    })

if __name__ == "__main__":
    app.run(port=5000)
