from keybert import KeyBERT
from transformers import pipeline

# Load models once at startup
kw_model = KeyBERT(model='all-MiniLM-L6-v2')

try:
    # Load a small LLM for fallback (adjust to your available hardware or use API)
    llama_pipe = pipeline(
        "text-generation",
        model="meta-llama/Llama-2-7b-chat-hf",  # Replace with llama2 if using Hugging Face Inference API
        device=0  # Set to -1 for CPU, or 0 for GPU
    )
except Exception as e:
    llama_pipe = None
    print(f"⚠️ LLaMA fallback not available: {e}")

def extract_keywords(prompt, max_keywords=2):
    # --- Tier 1: KeyBERT (semantic relevance) ---
    try:
        keywords = kw_model.extract_keywords(
            prompt,
            keyphrase_ngram_range=(1, 2),
            stop_words='english',
            top_n=max_keywords
        )
        extracted = [kw for kw, _ in keywords if kw.strip()]
        if extracted:
            return [k.lower() for k in extracted]
    except Exception as e:
        print(f"⚠️ KeyBERT failed: {e}")

    # --- Tier 2: Fallback to LLaMA-style LLM ---
    if llama_pipe:
        print("⏪ Falling back to LLaMA...")
        try:
            llm_prompt = (
                f"Extract {max_keywords} contextually relevant keywords or hashtags "
                f"from this sentence for marketing analysis:\n\n\"{prompt}\"\n\nKeywords:"
            )
            response = llama_pipe(llm_prompt, max_new_tokens=30, do_sample=True)
            text = response[0]['generated_text']
            keywords = text.split("Keywords:")[-1].strip().split(',')
            keywords = [k.strip().lower() for k in keywords if k.strip()]
            return keywords[:max_keywords]
        except Exception as e:
            print(f"❌ LLaMA fallback failed: {e}")

    # Last resort if both fail
    print("❌ No keywords extracted.")
    return []
