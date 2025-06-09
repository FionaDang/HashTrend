# keyword_extractor_llama3.py

import os
import traceback
from dotenv import load_dotenv
from huggingface_hub import InferenceClient

load_dotenv()
HF_TOKEN = os.getenv("HF_TOKEN")
if not HF_TOKEN:
    raise ValueError("❌ HF_TOKEN missing in .env")

client = InferenceClient(
    model="meta-llama/Meta-Llama-3-8B-Instruct",
    token=HF_TOKEN
)

def extract_keywords_llama(prompt, max_keywords=3):
    system_msg = {
        "role": "system",
        "content": (
            f"You are an assistant. Extract {max_keywords} relevant keywords from a description."
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
            return []
        print("🧪 Raw:", repr(text))
        return [k.strip().lower() for k in text.split(",") if k.strip()]
    except Exception as e:
        print("❌ Error:", e)
        traceback.print_exc()
        return []

if __name__ == "__main__":
    prompt = input("💬 Describe product/post: ").strip()
    if not prompt:
        print("❌ No input")
    else:
        print("🤖 Extracting keywords...")
        kws = extract_keywords_llama(prompt)
        print("🔑 Keywords:", ", ".join(kws) if kws else "None")
