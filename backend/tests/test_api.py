import sys
from pathlib import Path

# Add backend directory to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest
from fastapi.testclient import TestClient
from app.main import app

@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


def test_health_endpoint(client):
    """Verify health check endpoint returns 200 OK."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_invalid_reward_redemption_returns_404(client):
    """Verify redeeming a non-existent reward ID returns 404 Not Found."""
    response = client.post("/rewards/999999/redeem")
    assert response.status_code == 404
    assert response.json()["detail"] == "Reward not found"


def test_transactions_pagination_structure(client):
    """Verify GET /transactions returns expected structure."""
    response = client.get("/transactions?page=1&limit=5")
    assert response.status_code == 200
    json_data = response.json()
    assert "data" in json_data
    assert "pagination" in json_data
    assert len(json_data["data"]) <= 5
    assert json_data["pagination"]["page"] == 1
