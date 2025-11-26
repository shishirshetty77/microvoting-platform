import logging
import os
import time

import psycopg2
from redis import ConnectionError, Redis

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# --- Connection Functions ---
def get_redis_conn():
    redis_host = os.getenv("REDIS_HOST", "redis")
    redis_port = int(os.getenv("REDIS_PORT", 6379))
    while True:
        try:
            r = Redis(
                host=redis_host, port=redis_port, db=0, decode_responses=True
            )
            r.ping()
            logger.info("Successfully connected to Redis.")
            return r
        except ConnectionError:
            logger.warning(
                "Could not connect to Redis, retrying in 5 seconds..."
            )
            time.sleep(5)


def get_db_conn():
    db_host = os.getenv("DB_HOST", "db")
    db_name = os.getenv("DB_NAME", "postgres")
    db_user = os.getenv("DB_USER", "postgres")
    db_password = os.getenv("DB_PASSWORD", "postgres")
    while True:
        try:
            conn = psycopg2.connect(
                host=db_host,
                dbname=db_name,
                user=db_user,
                password=db_password,
            )
            logger.info("Successfully connected to the database.")
            return conn
        except psycopg2.OperationalError:
            logger.warning(
                "Could not connect to database, retrying in 5 seconds..."
            )
            time.sleep(5)


# --- Database Initialization ---
def initialize_database(conn):
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS votes (
                    id VARCHAR(255) PRIMARY KEY,
                    candidate VARCHAR(255) NOT NULL
                );
            """)
            conn.commit()
            logger.info("Database table 'votes' is ready.")
    except psycopg2.Error as e:
        logger.error(f"Error initializing database: {e}")
        # If initialization fails, it's a critical error, so we might exit
        # or handle it in a way that the application can retry.
        raise


# --- Main Worker Loop ---
def main():
    redis_conn = get_redis_conn()
    db_conn = get_db_conn()

    # Ensure the table exists before starting the loop
    try:
        initialize_database(db_conn)
    except Exception as e:
        logger.critical(f"Exiting due to database initialization failure: {e}")
        return  # Exit if DB can't be initialized

    logger.info("Worker started. Waiting for votes...")

    # Continuously process votes from the Redis queue
    while True:
        try:
            # Blocking pop from the 'votes' list
            vote = redis_conn.blpop("votes", timeout=0)[1]
            logger.info(f"Processing vote for '{vote}'...")

            # Insert the vote into the database
            with db_conn.cursor() as cursor:
                # Using a simplified unique ID for the example
                vote_id = f"vote_{int(time.time() * 1000)}"
                cursor.execute(
                    "INSERT INTO votes (id, candidate) VALUES (%s, %s)",
                    (vote_id, vote)
                )
                db_conn.commit()

            logger.info(
                f"Vote for '{vote}' successfully stored in the database."
            )

        except ConnectionError:
            logger.error("Connection to Redis lost. Reconnecting...")
            redis_conn = get_redis_conn()
        except psycopg2.Error as e:
            logger.error(f"Database error: {e}. Reconnecting...")
            db_conn.close()
            db_conn = get_db_conn()
            # Re-initialize to be safe, though the table should exist
            initialize_database(db_conn)
        except Exception as e:
            logger.error(f"An unexpected error occurred: {e}")
            # Wait a bit before retrying to avoid fast failure loops
            time.sleep(5)


if __name__ == "__main__":
    main()
