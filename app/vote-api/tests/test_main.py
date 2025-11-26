from fastapi.testclient import TestClient
from main import app
import pytest

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_submit_vote():
    response = client.post("/vote", json={"candidate": "A", "voter_id": "test-voter-id"})
    assert response.status_code in [200, 503]
