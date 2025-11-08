variable "gcp_project_id" {
  description = "The GCP project ID to deploy resources into."
  type        = string
}

variable "gcp_region" {
  description = "The GCP region to deploy resources into."
  type        = string
  default     = "us-central1"
}

variable "gke_cluster_name" {
  description = "The name for the GKE cluster."
  type        = string
  default     = "voting-app-cluster"
}

variable "vpc_network_name" {
  description = "The name of the VPC network."
  type        = string
  default     = "voting-app-vpc"
}

variable "artifact_registry_repo_name" {
  description = "The name for the Artifact Registry repository."
  type        = string
  default     = "voting-app-images"
}
