import os
from dotenv import load_dotenv
load_dotenv(".env")

from langchain_groq import ChatGroq

def test_groq():
    print("\n--- Testing ChatGroq ---")
    try:
        llm = ChatGroq(model="llama-3.3-70b-versatile")
        res = llm.invoke("Hi")
        print(f"Groq Success: {res.content}")
    except Exception as e:
        print(f"Groq Failed: {e}")

if __name__ == "__main__":
    test_groq()
