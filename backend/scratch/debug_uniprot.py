import asyncio
import httpx
import json

async def test():
    url = "https://rest.uniprot.org/uniprotkb/search"
    params = {"query": "HIV", "format": "json", "size": 1}
    async with httpx.AsyncClient() as client:
        r = await client.get(url, params=params)
        print(json.dumps(r.json(), indent=2))

if __name__ == "__main__":
    asyncio.run(test())
