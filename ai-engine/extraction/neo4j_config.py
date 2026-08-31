"""Shared Neo4j configuration for local development and Aura deployments."""

import os
from pathlib import Path

from neo4j import GraphDatabase


def load_backend_environment():
    """Load the server's dotenv file without requiring an extra Python package."""
    environment_file = Path(__file__).resolve().parents[2] / "lawyer-backend" / ".env"
    if not environment_file.exists():
        return
    for raw_line in environment_file.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


load_backend_environment()

URI = os.environ.get("NEO4J_URI")
USERNAME = os.environ.get("NEO4J_USERNAME")
PASSWORD = os.environ.get("NEO4J_PASSWORD")
DATABASE = os.environ.get("NEO4J_DATABASE", "neo4j")

if not all([URI, USERNAME, PASSWORD]):
    raise RuntimeError("Set NEO4J_URI, NEO4J_USERNAME, and NEO4J_PASSWORD in lawyer-backend/.env")

driver = GraphDatabase.driver(URI, auth=(USERNAME, PASSWORD))
