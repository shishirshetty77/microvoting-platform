import logging
import os

import uvicorn
from fastapi import FastAPI, status
from fastapi.responses import JSONResponse
from prometheus_client import Counter
from prometheus_fastapi_instrumentator import Instrumentator
from pydantic import BaseModel
from redis import ConnectionError, Redis

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class Vote(BaseModel):
    candidate: str
    voter_id: str


app = FastAPI()


instrumentator = Instrumentator().instrument(app)

votes_counter = Counter(
    "votes_total", "Total number of votes cast", labelnames=["candidate"]
)


@app.on_event("startup")
async def startup():
    instrumentator.expose(app)


def get_redis_conn():
    redis_host = os.getenv("REDIS_HOST", "redis")
    redis_port = int(os.getenv("REDIS_PORT", 6379))
    try:
        r = Redis(
            host=redis_host,
            port=redis_port,
            db=0,
            socket_connect_timeout=2,
            decode_responses=True,
        )
        r.ping()
        logger.info("Successfully connected to Redis.")
        return r
    except ConnectionError as e:
        logger.error(f"Could not connect to Redis: {e}")
        return None


redis_conn = get_redis_conn()


@app.post("/vote")
async def submit_vote(vote: Vote):
    if not redis_conn:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "message": "Voting service is currently unavailable. "
                           "Could not connect to Redis."
            },
        )

    try:
        votes_counter.labels(candidate=vote.candidate).inc()

        import json
        vote_data = json.dumps(
            {"voter_id": vote.voter_id, "candidate": vote.candidate}
        )
        redis_conn.rpush("votes", vote_data)
        logger.info(f"Vote for '{vote.candidate}' has been queued.")
        return {"message": f"Vote for '{vote.candidate}' accepted."}
    except Exception as e:
        logger.error(f"Error queueing vote: {e}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "message": "An error occurred while processing the vote."
            },
        )


@app.get("/health")
def health_check():
    return {"status": "ok"}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=80)
