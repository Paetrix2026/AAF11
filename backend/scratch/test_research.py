import asyncio
import os
from dotenv import load_dotenv
load_dotenv(".env")

import sys
sys.path.append(".")

from agents.FetchAgent import research_targets

async def test():
    print("Testing AI research for Osteosarcoma...")
    res = await research_targets("Osteosarcoma")
    print(f"Result: {res}")

if __name__ == "__main__":
    asyncio.run(test())
