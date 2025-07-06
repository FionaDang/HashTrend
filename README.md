# Hashtrend

**Hashtrend** is an AI-powered hashtag trend discovery tool that helps marketers, creators, and analysts identify the most relevant and trending Instagram hashtags based on a product or content description.

---

## Features

- **AI Keyword Extraction**  
  Uses Meta’s LLaMA 3 model to extract high-quality keywords from natural language input.

- **Instagram Hashtag Scraping**  
  Uses the Apify `instagram-hashtag-scraper` to fetch real Instagram posts based on keywords.

- **TF-IDF-Based Trend Scoring**  
  Computes relevance scores for hashtags based on Term Frequency–Inverse Document Frequency (TF-IDF), highlighting hashtags that are unique and representative.

- **Semantic Filtering**  
  Filters out irrelevant hashtags using semantic similarity from `sentence-transformers`.

- **Modern Frontend**  
  A beautiful, animated React UI with real-time feedback and keyword breakdowns.

---

# ⚙️ Setup Guide

This guide walks you through setting up the Hashtrend project locally.

---

## Prerequisites

- Python 3.8+
- Node.js (v16+ recommended)
- npm
- An Apify account + token
- A Hugging Face account + API token

---

## Environment Variables

Create a `.env` file in the `src/` directory:

```env
HF_TOKEN=your_huggingface_token
APIFY_API_TOKEN=your_apify_token
```

## Run Backend
Run the following command:
``` bash
python app.py
```

## Run Frontend
Run the following command:
``` bash
npm start
```

## Example Usage

```text
💬 You: I'm launching a new skincare brand focused on hydration and natural glow.
🤖 Hashtrend:
   - Extracted Keywords: skincare, hydration, glow
   - Top Hashtags:
     1. #skincarecommunity (score=92.3)
     2. #hydratedskin (score=89.5)
     3. #naturalskincare (score=85.0)
