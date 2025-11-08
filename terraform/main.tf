# --- VPC Network ---
resource "google_compute_network" "vpc_network" {
  name                    = var.vpc_network_name
  auto_create_subnetworks = false
}

resource "google_compute_subnetwork" "gke_subnet" {
  name          = "${var.vpc_network_name}-subnet"
  ip_cidr_range = "10.10.0.0/24"
  region        = var.gcp_region
  network       = google_compute_network.vpc_network.id
}

# --- GKE Cluster ---
resource "google_container_cluster" "primary" {
  name     = var.gke_cluster_name
  location = var.gcp_region

  # We can't create a cluster with no node pool defined, but we want to use
  # separately managed node pools. So we create the smallest possible default
  # node pool and immediately delete it.
  remove_default_node_pool = true
  initial_node_count       = 1

  network    = google_compute_network.vpc_network.id
  subnetwork = google_compute_subnetwork.gke_subnet.id
}

# Separately managed node pool
resource "google_container_node_pool" "primary_nodes" {
  name       = "${google_container_cluster.primary.name}-node-pool"
  location   = var.gcp_region
  cluster    = google_container_cluster.primary.name
  node_count = 2

  node_config {
    preemptible  = false
    machine_type = "e2-medium"

    # Enable Workload Identity
    workload_metadata_config {
      mode = "GKE_METADATA"
    }

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform"
    ]
  }
}

# --- Artifact Registry ---
resource "google_artifact_registry_repository" "repo" {
  location      = var.gcp_region
  repository_id = var.artifact_registry_repo_name
  description   = "Docker repository for the voting app"
  format        = "DOCKER"
}

# --- IAM for CI/CD ---
# Service account for the GitHub Actions CI/CD pipeline
resource "google_service_account" "github_actions_sa" {
  account_id   = "github-actions-runner"
  display_name = "Service Account for GitHub Actions"
}

# Grant Artifact Registry Writer role
resource "google_project_iam_member" "artifact_writer" {
  project = var.gcp_project_id
  role    = "roles/artifactregistry.writer"
  member  = "serviceAccount:${google_service_account.github_actions_sa.email}"
}

# Grant GKE Developer role
resource "google_project_iam_member" "gke_developer" {
  project = var.gcp_project_id
  role    = "roles/container.developer"
  member  = "serviceAccount:${google_service_account.github_actions_sa.email}"
}

# Grant Secret Manager Accessor role
resource "google_project_iam_member" "secret_accessor" {
  project = var.gcp_project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.github_actions_sa.email}"
}

# Allow the GitHub Actions SA to impersonate the GKE node service account
# This is needed for Workload Identity
resource "google_service_account_iam_member" "workload_identity_user" {
  service_account_id = google_service_account.github_actions_sa.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "serviceAccount:${var.gcp_project_id}.svc.id.goog[default/default]" # Adjust namespace/SA as needed
}
