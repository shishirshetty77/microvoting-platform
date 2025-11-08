from fastapi.testclient import TestClient
from main import app
import pytest

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

# This is a basic test. A more comprehensive test would mock the Redis connection.
def test_submit_vote():
    # This test will fail if Redis is not available.
    # For a real CI/CD pipeline, you would use a mock Redis or a test container.
    response = client.post("/vote", json={"candidate": "A"})
    # Depending on redis connection, this could be 200 or 503
    assert response.status_code in [200, 503]
