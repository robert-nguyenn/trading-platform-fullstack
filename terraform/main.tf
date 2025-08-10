# Mercato Trading Platform Infrastructure
# Terraform configuration for scalable Kubernetes deployment

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.23"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.11"
    }
  }
  
  backend "s3" {
    bucket = "mercato-terraform-state"
    key    = "infrastructure/terraform.tfstate"
    region = "us-east-1"
    encrypt = true
    dynamodb_table = "mercato-terraform-locks"
  }
}

# Variables
variable "cluster_name" {
  description = "Name of the EKS cluster"
  type        = string
  default     = "mercato-trading-cluster"
}

variable "region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "node_instance_types" {
  description = "EC2 instance types for worker nodes"
  type        = list(string)
  default     = ["c5.2xlarge", "c5.4xlarge"]
}

variable "min_nodes" {
  description = "Minimum number of worker nodes"
  type        = number
  default     = 3
}

variable "max_nodes" {
  description = "Maximum number of worker nodes"
  type        = number
  default     = 20
}

variable "desired_nodes" {
  description = "Desired number of worker nodes"
  type        = number
  default     = 5
}

# Provider Configuration
provider "aws" {
  region = var.region
  
  default_tags {
    tags = {
      Project     = "Mercato"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# Data Sources
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

# VPC Configuration
resource "aws_vpc" "mercato_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "${var.cluster_name}-vpc"
    "kubernetes.io/cluster/${var.cluster_name}" = "shared"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "mercato_igw" {
  vpc_id = aws_vpc.mercato_vpc.id

  tags = {
    Name = "${var.cluster_name}-igw"
  }
}

# Public Subnets
resource "aws_subnet" "public_subnets" {
  count = 3

  vpc_id                  = aws_vpc.mercato_vpc.id
  cidr_block              = "10.0.${count.index + 1}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.cluster_name}-public-subnet-${count.index + 1}"
    "kubernetes.io/cluster/${var.cluster_name}" = "shared"
    "kubernetes.io/role/elb" = "1"
  }
}

# Private Subnets
resource "aws_subnet" "private_subnets" {
  count = 3

  vpc_id            = aws_vpc.mercato_vpc.id
  cidr_block        = "10.0.${count.index + 4}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "${var.cluster_name}-private-subnet-${count.index + 1}"
    "kubernetes.io/cluster/${var.cluster_name}" = "owned"
    "kubernetes.io/role/internal-elb" = "1"
  }
}

# NAT Gateways
resource "aws_eip" "nat_eips" {
  count = 3
  domain = "vpc"

  tags = {
    Name = "${var.cluster_name}-nat-eip-${count.index + 1}"
  }
}

resource "aws_nat_gateway" "nat_gateways" {
  count = 3

  allocation_id = aws_eip.nat_eips[count.index].id
  subnet_id     = aws_subnet.public_subnets[count.index].id

  tags = {
    Name = "${var.cluster_name}-nat-gw-${count.index + 1}"
  }

  depends_on = [aws_internet_gateway.mercato_igw]
}

# Route Tables
resource "aws_route_table" "public_rt" {
  vpc_id = aws_vpc.mercato_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.mercato_igw.id
  }

  tags = {
    Name = "${var.cluster_name}-public-rt"
  }
}

resource "aws_route_table" "private_rt" {
  count  = 3
  vpc_id = aws_vpc.mercato_vpc.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.nat_gateways[count.index].id
  }

  tags = {
    Name = "${var.cluster_name}-private-rt-${count.index + 1}"
  }
}

# Route Table Associations
resource "aws_route_table_association" "public_rta" {
  count = 3

  subnet_id      = aws_subnet.public_subnets[count.index].id
  route_table_id = aws_route_table.public_rt.id
}

resource "aws_route_table_association" "private_rta" {
  count = 3

  subnet_id      = aws_subnet.private_subnets[count.index].id
  route_table_id = aws_route_table.private_rt[count.index].id
}

# Security Groups
resource "aws_security_group" "eks_cluster_sg" {
  name_prefix = "${var.cluster_name}-cluster-sg"
  vpc_id      = aws_vpc.mercato_vpc.id

  ingress {
    from_port = 443
    to_port   = 443
    protocol  = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.cluster_name}-cluster-sg"
  }
}

resource "aws_security_group" "eks_node_sg" {
  name_prefix = "${var.cluster_name}-node-sg"
  vpc_id      = aws_vpc.mercato_vpc.id

  ingress {
    from_port = 0
    to_port   = 65535
    protocol  = "tcp"
    self      = true
  }

  ingress {
    from_port       = 1025
    to_port         = 65535
    protocol        = "tcp"
    security_groups = [aws_security_group.eks_cluster_sg.id]
  }

  ingress {
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.eks_cluster_sg.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.cluster_name}-node-sg"
  }
}

# Outputs
output "cluster_endpoint" {
  description = "EKS cluster endpoint"
  value       = aws_eks_cluster.mercato_cluster.endpoint
}

output "cluster_security_group_id" {
  description = "Security group ID attached to the EKS cluster"
  value       = aws_eks_cluster.mercato_cluster.vpc_config[0].cluster_security_group_id
}

output "cluster_name" {
  description = "EKS cluster name"
  value       = aws_eks_cluster.mercato_cluster.name
}

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.mercato_vpc.id
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = aws_subnet.private_subnets[*].id
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = aws_subnet.public_subnets[*].id
}
