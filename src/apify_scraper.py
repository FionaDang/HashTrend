import requests
import json
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
API_TOKEN = os.getenv("APIFY_API_TOKEN")

# Load config
with open('config/apify_config.json') as f:
    config = json.load(f)

# Define the API URL for running the scraper
SCRAPER_URL = f"https://api.apify.com/v2/acts/{config['actorId']}/runs?token={API_TOKEN}"


def run_scraper(hashtag):
    payload = {
        "input": {
            "searchType": config["searchType"],      # e.g. "hashtag", "profile" or "location"
            "search": hashtag,                       # just the raw tag, without the #
            "resultsLimit": config["maxPosts"],      # max number of posts to fetch
            "proxy": config["proxy"]
    }
}
    # Note: actor runs expect the input JSON under "body"
    response = requests.post(SCRAPER_URL, json=payload)
    if response.status_code == 201:
        run_id = response.json()["data"]["id"]
        print(f"Scraper started (run ID: {run_id})")
        return run_id
    else:
        print("`Error starting scraper:", response.json())
        return None


def fetch_results(run_id):
    url = f"https://api.apify.com/v2/acts/{config['actorId']}/runs?token={API_TOKEN}"
    response = requests.get(url)
    if response.status_code == 200:
        data = response.json()
        with open('data/scraped_data.json', 'w') as f:
            json.dump(data, f, indent=2)
        print(f"Data saved to data/scraped_data.json")
    else:
        print(f"Error fetching results: {response.text}")

# Example usage
if __name__ == "__main__":
    hashtag = input("Enter a hashtag to scrape: ")
    run_id = run_scraper(hashtag)
    if run_id:
        print("Waiting for the scraper to finish... (around 1-2 mins)")
        fetch_results(run_id)
