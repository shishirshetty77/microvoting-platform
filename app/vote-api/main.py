import os
import logging
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from redis import Redis, ConnectionError
from pydantic import BaseModel
from prometheus_fastapi_instrumentator import Instrumentator
from prometheus_client import Counter

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# Define the vote model
class Vote(BaseModel):
    candidate: str


# Initialize FastAPI app
app = FastAPI()


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


# Instrument the app with Prometheus
instrumentator = Instrumentator().instrument(app)

# Add a custom metric to count votes
votes_counter = Counter(
    "votes_total", "Total number of votes cast", labelnames=["candidate"]
)


@app.on_event("startup")
async def startup():
    instrumentator.expose(app)


# Connect to Redis
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
                "message": "Voting service is currently unavailable. Could not connect to Redis."
            },
        )

    try:
        # Increment the custom metric
        votes_counter.labels(candidate=vote.candidate).inc()

        # Push the vote to a Redis list
        redis_conn.rpush("votes", vote.candidate)
        logger.info(f"Vote for '{vote.candidate}' has been queued.")
        return {"message": f"Vote for '{vote.candidate}' accepted."}
    except Exception as e:
        logger.error(f"Error queueing vote: {e}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"message": "An error occurred while processing the vote."},
        )


@app.get("/health")
def health_check():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=80)
