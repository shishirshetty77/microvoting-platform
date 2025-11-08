# Architecture

This document provides a high-level overview of the application's architecture.

## Services

The application is composed of six main components:

- **Vote UI**: A single-page React application that serves as the user interface for voting. It communicates with the `vote-api` to submit votes and the `result-api` to display results.

- **Vote API**: A Python FastAPI service that receives votes via a RESTful endpoint. It pushes each vote onto a Redis queue for asynchronous processing.

- **Worker**: A Python script that continuously monitors the Redis queue. It dequeues votes and persists them into a PostgreSQL database.

- **Result API**: A Python FastAPI service that queries the PostgreSQL database to aggregate the votes and exposes the results via a RESTful endpoint.

- **Redis**: An in-memory data store used as a message broker between the `vote-api` and the `worker`.

- **PostgreSQL**: A relational database used to store and persist the votes.

## Technology Stack

- **Frontend**: React, Vite, TypeScript
- **Backend**: Python, FastAPI
- **Database**: PostgreSQL
- **Queue**: Redis
- **Containerization**: Docker
- **Orchestration**: Kubernetes (GKE)
- **Infrastructure**: Terraform
- **Deployment**: Helm
- **CI/CD**: GitHub Actions
- **Monitoring**: Prometheus, Grafana

## Data Flow

1.  A user visits the **Vote UI** and clicks a voting button.
2.  The UI sends a POST request to the **Vote API**.
3.  The **Vote API** pushes the vote onto the **Redis** queue.
4.  The **Worker** dequeues the vote from the **Redis** queue.
5.  The **Worker** stores the vote in the **PostgreSQL** database.
6.  The **Result API** queries the **PostgreSQL** database to get the vote counts.
7.  The **Vote UI** periodically fetches the results from the **Result API** and updates the display.
