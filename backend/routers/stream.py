import asyncio
import json
from fastapi import APIRouter, HTTPException
from sse_starlette.sse import EventSourceResponse
from routers.analysis import _runs

router = APIRouter()


@router.get("/stream/{run_id}")
async def stream_pipeline(run_id: str):
    if run_id not in _runs:
        raise HTTPException(status_code=404, detail="Run not found")

    async def event_generator():
        sent_steps = 0
        max_wait = 300  # 5 minute timeout
        waited = 0

        while waited < max_wait:
            run = _runs.get(run_id)
            if not run:
                break

            steps = run.get("steps", [])
            # Send any new steps
            while sent_steps < len(steps):
                step_str = steps[sent_steps]
                parts = step_str.split(":", 2)
                if len(parts) == 3:
                    agent, status, message = parts
                    yield {
                        "event": "update",
                        "data": json.dumps({
                            "agent": agent,
                            "status": status,
                            "message": message,
                        })
                    }
                sent_steps += 1

            # Heartbeat every 5 seconds to keep connection alive
            if int(waited * 2) % 10 == 0:
                yield {"event": "heartbeat", "data": "alive"}

            if run.get("status") == "completed":
                result = run.get("result")
                yield {"data": json.dumps({"done": True, "result": result})}
                break
            elif run.get("status") == "failed":
                yield {"data": json.dumps({"done": True, "error": run.get("error", "Pipeline failed")})}
                break

            await asyncio.sleep(0.5)
            waited += 0.5

    return EventSourceResponse(event_generator())
