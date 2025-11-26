import logging
import os

import psycopg2
import uvicorn
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from prometheus_client import Gauge
from prometheus_fastapi_instrumentator import Instrumentator
from psycopg2.extras import RealDictCursor

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()


instrumentator = Instrumentator().instrument(app)

results_gauge = Gauge(
    "vote_results", "Current vote counts for each candidate",
    labelnames=["candidate"]
)


@app.on_event("startup")
async def startup():
    instrumentator.expose(app)


def get_db_conn():
    db_host = os.getenv("DB_HOST", "db")
    db_name = os.getenv("DB_NAME", "postgres")
    db_user = os.getenv("DB_USER", "postgres")
    db_password = os.getenv("DB_PASSWORD", "postgres")

    try:
        conn = psycopg2.connect(
            host=db_host,
            dbname=db_name,
            user=db_user,
            password=db_password,
            connect_timeout=3,
        )
        logger.info("Successfully connected to the database.")
        return conn
    except psycopg2.OperationalError as e:
        logger.error(f"Could not connect to database: {e}")
        return None


@app.get("/results")
def get_results():
    conn = get_db_conn()
    if not conn:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "message": "Result service is currently unavailable. "
                           "Could not connect to the database."
            },
        )

    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(
                "SELECT candidate, COUNT(id) AS votes "
                "FROM votes GROUP BY candidate"
            )
            results = cursor.fetchall()

        vote_counts = {row["candidate"]: row["votes"] for row in results}

        for candidate, votes in vote_counts.items():
            results_gauge.labels(candidate=candidate).set(votes)

        return vote_counts

    except Exception as e:
        logger.error(f"Error querying results: {e}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"message": "An error occurred while fetching results."},
        )
    finally:
        if conn:
            conn.close()


@app.post("/reset")
async def reset_votes(request: Request):
    admin_key = os.getenv("ADMIN_KEY", "rivooq")
    request_key = request.headers.get("X-Admin-Key")

    if request_key != admin_key:
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"message": "Unauthorized. Invalid Admin Key."},
        )

    conn = get_db_conn()
    if not conn:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"message": "Could not connect to the database."},
        )
    try:
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM votes;")
            conn.commit()
        for candidate in ["a", "b"]:
            results_gauge.labels(candidate=candidate).set(0)
        return {"message": "Votes have been reset."}
    except Exception as e:
        logger.error(f"Error resetting votes: {e}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"message": "An error occurred while resetting votes."},
        )
    finally:
        if conn:
            conn.close()


@app.get("/health")
def health_check():
    return {"status": "ok"}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=80)
