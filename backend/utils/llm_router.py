import os
from langchain_groq import ChatGroq
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_openai import ChatOpenAI

def get_llm(provider="google") -> any:
    try:
        if provider == "google" or provider == "vertex":
            return get_google()
        elif provider == "nvidia":
            return get_nvidia()
        return get_groq()
    except Exception as e:
        print(f"⚠️ Provider {provider} failed: {e}. Falling back to Groq.")
        return get_groq()

def get_groq() -> ChatGroq:
    api_key = os.getenv("GROQ_API_KEY")
    return ChatGroq(
        model="llama-3.3-70b-versatile",
        temperature=0.1,
        api_key=api_key,
    )

def get_google() -> any:
    # Use Google Generative AI SDK (Modern)
    api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
    
    # Try ChatGoogleGenerativeAI first
    if api_key:
        try:
            return ChatGoogleGenerativeAI(
                model="gemini-1.5-flash",
                google_api_key=api_key,
                temperature=0.1,
                max_retries=1,
            )
        except Exception as e:
            print(f"ChatGoogleGenerativeAI init failed: {e}")

    # Fallback to Vertex AI if configured
    try:
        from langchain_google_vertexai import ChatVertexAI
        return ChatVertexAI(
            model="gemini-1.5-flash",
            temperature=0.1,
            max_retries=1,
        )
    except Exception as e:
        print(f"ChatVertexAI fallback failed: {e}")
        return get_groq()

def get_nvidia() -> ChatOpenAI:
    api_key = os.getenv("NVIDIA_API_KEY")
    return ChatOpenAI(
        model="google/gemma-2-27b-it",
        api_key=api_key,
        base_url="https://integrate.api.nvidia.com/v1"
    )
