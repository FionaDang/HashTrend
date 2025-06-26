import os
import json
import requests
from dotenv import load_dotenv

# ─── 1) Load env & config ───────────────────────────────────────────────────────
load_dotenv()
API_TOKEN = os.getenv("APIFY_API_TOKEN")
if not API_TOKEN:
    raise RuntimeError("APIFY_API_TOKEN not set in .env")

import os

config_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'config', 'apify_config.json'))
with open(config_path, 'r', encoding='utf-8') as f:
    config = json.load(f)

ACTOR_ID = config['actorId']        # "apify~instagram-hashtag-scraper"
BASE_URL = "https://api.apify.com/v2"
SYNC_URL = f"{BASE_URL}/acts/{ACTOR_ID}/run-sync-get-dataset-items?token={API_TOKEN}"

# ─── 2) Single-shot sync run + fetch ───────────────────────────────────────────
def run_and_fetch_sync(hashtag):
    payload = {
        "hashtags":     [hashtag],
        "resultsType":  config.get("resultsType", "posts"),
        "resultsLimit": config.get("resultsLimit", 100),
    }
    # if config.get("proxy"):
    #     payload["proxy"] = config["proxy"]

    print(f"🚀 Running actor synchronously for #{hashtag}...")
    resp = requests.post(SYNC_URL, json=payload)

    # Accept both 200 and 201 as “success”
    if resp.status_code not in (200, 201):
        print("❌ Error in sync run:", resp.status_code, resp.text)
        return

    # The full dataset items are in the response body
    items = resp.json()
    print(f"📊 Retrieved {len(items)} items")

    # Save them
    os.makedirs("data", exist_ok=True)
    with open("data/scraped_data.json", "w", encoding="utf-8") as f:
        json.dump(items, f, ensure_ascii=False, indent=2)
    print("✅ Saved to data/scraped_data.json")
    return items

# ─── 3) CLI Entrypoint ─────────────────────────────────────────────────────────
if __name__ == "__main__":
    tag = input("Enter a hashtag to scrape (without #): ").strip()
    if tag:
        run_and_fetch_sync(tag)
    else:
        print("🔴 No hashtag provided. Exiting.")
