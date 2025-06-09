# keyword_extractor_llama3.py

import os
import traceback
from typing import List
from dotenv import load_dotenv
from pydantic import BaseModel
from huggingface_hub import InferenceClient

# ─── Load Hugging Face Token ───────────────────────────────────────────
load_dotenv()
HF_TOKEN = os.getenv("HF_TOKEN")
if not HF_TOKEN:
    raise ValueError("❌ HF_TOKEN missing in .env")

client = InferenceClient(
    model="meta-llama/Meta-Llama-3-8B-Instruct",
    token=HF_TOKEN
)

# ─── Pydantic Result Model ──────────────────────────────────────────────
class KeywordResult(BaseModel):
    keywords: List[str]

# ─── Extract Keywords with LLaMA 3 ───────────────────────────────────────
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
        if not text:
            print("⚠️ Empty response")
            return KeywordResult(keywords=[])
        print("🧪 Raw response:", repr(text))
        return KeywordResult(keywords=[k.strip().lower() for k in text.split(",") if k.strip()])
    except Exception as e:
        print("❌ LLaMA 3 API error:", e)
        traceback.print_exc()
        return KeywordResult(keywords=[])

# ─── CLI Entrypoint ─────────────────────────────────────────────────────
if __name__ == "__main__":
    prompt = input("💬 Describe your product or post: ").strip()
    if not prompt:
        print("❌ No input provided.")
    else:
        print("🤖 Extracting keywords using LLaMA 3...")
        result = extract_keywords_llama(prompt)
        if result.keywords:
            print("🔑 Extracted Keywords:", ", ".join(result.keywords))
        else:
            print("⚠️ No keywords extracted.")
