# Example Voting App - Modern Edition

This project is a cloud-native, production-grade version of the classic Docker example voting application. It is built with a microservices architecture and deployed to Google Kubernetes Engine (GKE) using a complete DevOps toolchain including Terraform, Helm, Prometheus, and GitHub Actions.

## Project Structure

```
example-voting-app-modern/
├── app/                  # Application source code
│   ├── result-api/       # FastAPI app to query results
│   ├── vote-api/         # FastAPI app to receive votes
│   ├── vote-ui/          # React frontend for voting
│   └── worker/           # Python worker to process votes
├── charts/               # Helm charts
│   └── voting-app/       # Umbrella chart for the entire application
│       └── charts/       # Sub-charts for each service
├── docs/                 # Detailed documentation
├── terraform/            # Terraform code for GCP infrastructure
├── .github/workflows/    # GitHub Actions for CI/CD
└── README.md             # This file
```

---

## Architecture and Data Flow

The application follows a microservices pattern with a clear separation of concerns.

1.  **Voting**: A user visits the **Vote UI** (React frontend) and casts a vote. The UI sends a POST request to the **Vote API**.
2.  **Queueing**: The **Vote API** (FastAPI) receives the vote and pushes it onto a **Redis** queue for asynchronous processing. This ensures that the voting process is fast and resilient.
3.  **Processing**: The **Worker** (Python script) continuously listens to the Redis queue, dequeues new votes, and persists them in the **PostgreSQL** database.
4.  **Results**: The **Result API** (FastAPI) provides an endpoint that queries the PostgreSQL database to aggregate the total votes for each candidate.
5.  **Display**: The **Vote UI** periodically polls the **Result API** to fetch the latest vote counts and updates the results display in real-time.

![Architecture Diagram](docs/architecture.png) <!-- You would create this image -->

### Technology Stack
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

---

## How to Run Locally (Docker Compose)

For local development and testing, you can run the entire application stack using Docker Compose.

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

### Steps
1.  **Build and run the application:**
    From the root of the project, run:
    ```bash
    docker-compose up --build
    ```
    This command will:
    - Build the Docker images for `vote-ui`, `vote-api`, `result-api`, and `worker`.
    - Start containers for all services, including Redis and PostgreSQL.
    - Mount the `init.sql` script to create the `votes` table in PostgreSQL.

2.  **Access the application:**
    - The voting UI will be available at **http://localhost:3000**.
    - The vote API is available at `http://localhost:8080`.
    - The result API is available at `http://localhost:8081`.

3.  **To stop the application:**
    Press `Ctrl+C` in the terminal where `docker-compose` is running. To remove the containers and volumes, run:
    ```bash
    docker-compose down -v
    ```

---

## Deployment to GCP (Terraform & Helm)

This section details how to deploy the application to a production-like environment on Google Kubernetes Engine.

### Prerequisites
- A GCP project with billing enabled.
- [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) (`gcloud`)
- [Terraform](https://learn.hashicorp.com/tutorials/terraform/install-cli)
- [Helm](https://helm.sh/docs/intro/install/)

### Step 1: Set Up GCP Environment
- Follow the detailed instructions in **[docs/setup-gcp.md](./docs/setup-gcp.md)** to configure your GCP project, enable APIs, set up Workload Identity for GitHub Actions, and create the necessary secrets in your GitHub repository.

### Step 2: Deploy Infrastructure with Terraform
- This will provision the GKE cluster, VPC network, and Artifact Registry.
1.  Navigate to the `terraform/` directory.
2.  Initialize Terraform: `terraform init`
3.  Review and apply the plan:
    ```bash
    terraform apply -var="gcp_project_id=your-gcp-project-id"
    ```
    (Replace `your-gcp-project-id` with your actual GCP project ID).

### Step 3: Deploy Application with Helm
- This will deploy the application and the monitoring stack to your GKE cluster.
1.  Navigate to the `charts/voting-app/` directory.
2.  Add the required Helm repositories:
    ```bash
    helm repo add bitnami https://charts.bitnami.com/bitnami
    helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
    ```
3.  Update Helm dependencies to download the sub-charts: `helm dependency update`
4.  Deploy to the `dev` environment:
    ```bash
    helm upgrade --install voting-app . \
      --namespace dev \
      --create-namespace \
      -f values-dev.yaml \
      --set global.imageRegistry=<your-artifact-registry-url>
    ```
    (Replace `<your-artifact-registry-url>` with the output from `terraform output artifact_registry_repository_url`).

### Accessing the Deployed Application
- The `vote-ui` is exposed via a LoadBalancer. Get the external IP with:
  ```bash
  kubectl get svc vote-ui -n dev
  ```
- Access the application at `http://<EXTERNAL-IP>`.

---

## CI/CD Pipeline (GitHub Actions)

The project includes a full CI/CD pipeline. For a detailed explanation of the workflows, see **[docs/ci-cd.md](./docs/ci-cd.md)**.

- **`ci.yml`**: Triggered on push/pull-request to `main`. It builds, tests, scans, and pushes Docker images to Artifact Registry.
- **`cd-dev.yml`**: Triggered on merge to `main`. It automatically deploys the latest version to the `dev` GKE namespace.
- **`cd-prod.yml`**: A manually triggered workflow to deploy a specific version to the `prod` namespace, with an approval step.

---

## Observability (Prometheus & Grafana)

The `kube-prometheus-stack` is deployed via the Helm chart to provide a full monitoring solution.

- The `vote-api` and `result-api` expose custom metrics at their `/metrics` endpoints.
- Prometheus is configured to automatically scrape these metrics.
- A sample Grafana dashboard is included to visualize the votes.

For instructions on accessing Grafana and Prometheus, see **[docs/observability.md](./docs/observability.md)**.

---

## Teardown

To avoid incurring charges, you can tear down the deployed resources.

1.  **Uninstall the Helm release:**
    ```bash
    helm uninstall voting-app -n dev
    ```
2.  **Destroy the GCP infrastructure:**
    Navigate to the `terraform` directory and run:
    ```bash
    terraform destroy -var="gcp_project_id=your-gcp-project-id"
    ```

For more details, see **[docs/teardown.md](./docs/teardown.md)**.