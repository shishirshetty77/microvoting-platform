import os
import logging
import psycopg2
from fastapi import FastAPI, status
from fastapi.responses import JSONResponse
from psycopg2.extras import RealDictCursor
from prometheus_fastapi_instrumentator import Instrumentator, Gauge

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI()

# Instrument the app with Prometheus
instrumentator = Instrumentator().instrument(app)

# Add a custom metric to report vote counts
results_gauge = Gauge("vote_results", "Current vote counts for each candidate", labels=["candidate"])

@app.on_event("startup")
async def startup():
    instrumentator.expose(app)

# Database connection details
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
            connect_timeout=3
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
            content={"message": "Result service is currently unavailable. Could not connect to the database."},
        )

    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute("SELECT candidate, COUNT(id) AS votes FROM votes GROUP BY candidate")
            results = cursor.fetchall()
        
        # Convert list of dicts to a single dict
        vote_counts = {row['candidate']: row['votes'] for row in results}

        # Update the gauge metric
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

@app.get("/health")
def health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=80)
