terraform {
  required_version = ">= 1.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }

  # Configure the GCS backend for remote state storage.
  # You must create this GCS bucket manually before running 'terraform init'.
  # Example: gsutil mb gs://your-tf-state-bucket-name
  backend "gcs" {
    bucket  = "your-tf-state-bucket-name" # <-- IMPORTANT: Replace with your GCS bucket name
    prefix  = "terraform/state"
  }
}

provider "google" {
  project = var.gcp_project_id
  region  = var.gcp_region
}
