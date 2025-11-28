# GKE Cluster
resource "google_container_cluster" "primary" {
  name     = "microvoting-cluster"
  location = var.zone

  # We can't create a cluster with no node pool defined, but we want to only use
  # separately managed node pools. So we create the smallest possible default
  # node pool and immediately delete it.
  remove_default_node_pool = true
  initial_node_count       = 1

  network    = google_compute_network.vpc.name
  subnetwork = google_compute_subnetwork.subnet.name

  ip_allocation_policy {
    cluster_secondary_range_name  = "pod-ranges"
    services_secondary_range_name = "service-ranges"
  }

  # Enable Cloud Monitoring and Logging
  monitoring_service = "monitoring.googleapis.com/kubernetes"
  logging_service    = "logging.googleapis.com/kubernetes"
}

# Managed Node Pool
resource "google_container_node_pool" "primary_nodes" {
  name       = "microvoting-node-pool"
  location   = var.zone
  cluster    = google_container_cluster.primary.name
  node_count = 1

  node_config {
    preemptible  = true # Spot instances for cost saving
    machine_type = "e2-medium"

    # Google recommends custom service accounts that have cloud-platform scope and permissions granted via IAM Roles.
    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform"
    ]

    disk_size_gb = 30 # Reduced disk size to save cost
    disk_type    = "pd-standard"
  }

  autoscaling {
    min_node_count = 1
    max_node_count = 3
  }
}
