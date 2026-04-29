import asyncio
from utils.fetch_utils import fetch_uniprot_search

async def main():
    print("Testing UniProt search for 'HIV'...")
    results = await fetch_uniprot_search("HIV")
    print(f"Results: {len(results)}")
    for r in results:
        print(f" - {r['name']} ({r['id']})")

if __name__ == "__main__":
    asyncio.run(main())
