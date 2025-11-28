variable "region" {
  description = "AWS region"
  default     = "ap-south-1"
}

variable "cluster_name" {
  description = "Name of the EKS cluster"
  default     = "microvoting-cluster"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  default     = "10.0.0.0/16"
}
