terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = ">= 4.0.0"
    }
  }
}

provider "google" {
  project     = var.project_id
  region      = var.region
  zone        = var.zone
  credentials = file("/Users/rivooq/Desktop/iasaccount-key.json")
}

# VPC
resource "google_compute_network" "vpc" {
  name                    = "voting-vpc"
  auto_create_subnetworks = false
}

# Subnet
resource "google_compute_subnetwork" "subnet" {
  name          = "voting-subnet"
  region        = var.region
  network       = google_compute_network.vpc.name
  ip_cidr_range = "10.0.0.0/24"

  secondary_ip_range {
    range_name    = "pod-ranges"
    ip_cidr_range = "10.1.0.0/16"
  }

  secondary_ip_range {
    range_name    = "service-ranges"
    ip_cidr_range = "10.2.0.0/20"
  }
}
