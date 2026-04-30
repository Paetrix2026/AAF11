import os
from dotenv import load_dotenv
load_dotenv(".env")

from langchain_google_vertexai import ChatVertexAI
from langchain_google_genai import ChatGoogleGenerativeAI

def test_vertex():
    print("\n--- Testing ChatVertexAI ---")
    try:
        llm = ChatVertexAI(model="gemini-1.5-flash")
        res = llm.invoke("Hi")
        print(f"Vertex Success: {res.content}")
    except Exception as e:
        print(f"Vertex Failed: {e}")

def test_genai():
    print("\n--- Testing ChatGoogleGenerativeAI ---")
    api_key = os.getenv("GOOGLE_API_KEY")
    try:
        llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", google_api_key=api_key)
        res = llm.invoke("Hi")
        print(f"GenAI Success: {res.content}")
    except Exception as e:
        print(f"GenAI Failed: {e}")

if __name__ == "__main__":
    test_vertex()
    test_genai()
