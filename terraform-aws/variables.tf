variable "aws_region" {
  description = "AWS region"
  default     = "ap-south-1"
}


variable "project_name" {
  description = "Project name for tagging"
  default     = "microvoting"
}

variable "vpc_cidr" {
  description = "VPC CIDR block"
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Availability zones"
  default     = ["ap-south-1a", "ap-south-1b"]
}

variable "public_subnet_cidrs" {
  description = "Public subnet CIDR blocks"
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "Private subnet CIDR blocks"
  default     = ["10.0.11.0/24", "10.0.12.0/24"]
}




# EKS Cluster Variables
variable "cluster_name" {
  description = "EKS cluster name"
  default     = "microvoting-cluster"
}

variable "cluster_version" {
  description = "Kubernetes version"
  default     = "1.31"
}

variable "node_instance_types" {
  description = "EC2 instance types for worker nodes"
  default     = ["t3.large"]
}

variable "node_desired_size" {
  description = "Desired number of worker nodes"
  default     = 3
}

variable "node_min_size" {
  description = "Minimum number of worker nodes"
  default     = 2
}

variable "node_max_size" {
  description = "Maximum number of worker nodes"
  default     = 6
}

variable "node_disk_size" {
  description = "Disk size for worker nodes in GB"
  default     = 30
}