# EKS Cluster and Node Groups Configuration

# IAM Role for EKS Cluster
resource "aws_iam_role" "eks_cluster_role" {
  name = "${var.cluster_name}-cluster-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "eks.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "eks_cluster_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
  role       = aws_iam_role.eks_cluster_role.name
}

# IAM Role for EKS Node Group
resource "aws_iam_role" "eks_node_role" {
  name = "${var.cluster_name}-node-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "eks_worker_node_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
  role       = aws_iam_role.eks_node_role.name
}

resource "aws_iam_role_policy_attachment" "eks_cni_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
  role       = aws_iam_role.eks_node_role.name
}

resource "aws_iam_role_policy_attachment" "eks_container_registry_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
  role       = aws_iam_role.eks_node_role.name
}

# EKS Cluster
resource "aws_eks_cluster" "mercato_cluster" {
  name     = var.cluster_name
  role_arn = aws_iam_role.eks_cluster_role.arn
  version  = "1.28"

  vpc_config {
    subnet_ids              = concat(aws_subnet.private_subnets[*].id, aws_subnet.public_subnets[*].id)
    endpoint_private_access = true
    endpoint_public_access  = true
    public_access_cidrs     = ["0.0.0.0/0"]
    security_group_ids      = [aws_security_group.eks_cluster_sg.id]
  }

  enabled_cluster_log_types = ["api", "audit", "authenticator", "controllerManager", "scheduler"]

  encryption_config {
    provider {
      key_arn = aws_kms_key.eks_encryption_key.arn
    }
    resources = ["secrets"]
  }

  depends_on = [
    aws_iam_role_policy_attachment.eks_cluster_policy,
    aws_cloudwatch_log_group.eks_cluster_log_group,
  ]

  tags = {
    Name = var.cluster_name
  }
}

# CloudWatch Log Group for EKS
resource "aws_cloudwatch_log_group" "eks_cluster_log_group" {
  name              = "/aws/eks/${var.cluster_name}/cluster"
  retention_in_days = 7

  tags = {
    Name = "${var.cluster_name}-log-group"
  }
}

# KMS Key for EKS Encryption
resource "aws_kms_key" "eks_encryption_key" {
  description             = "EKS Secret Encryption Key"
  deletion_window_in_days = 7

  tags = {
    Name = "${var.cluster_name}-encryption-key"
  }
}

resource "aws_kms_alias" "eks_encryption_key_alias" {
  name          = "alias/${var.cluster_name}-encryption-key"
  target_key_id = aws_kms_key.eks_encryption_key.key_id
}

# High-Performance Node Group for Trading Workloads
resource "aws_eks_node_group" "high_performance_nodes" {
  cluster_name    = aws_eks_cluster.mercato_cluster.name
  node_group_name = "high-performance-nodes"
  node_role_arn   = aws_iam_role.eks_node_role.arn
  subnet_ids      = aws_subnet.private_subnets[*].id

  instance_types = ["c5.4xlarge", "c5.9xlarge"]
  capacity_type  = "ON_DEMAND"

  scaling_config {
    desired_size = var.desired_nodes
    max_size     = var.max_nodes
    min_size     = var.min_nodes
  }

  update_config {
    max_unavailable_percentage = 25
  }

  remote_access {
    ec2_ssh_key               = "mercato-key-pair"
    source_security_group_ids = [aws_security_group.eks_node_sg.id]
  }

  # Enhanced networking for low-latency
  launch_template {
    id      = aws_launch_template.high_performance_template.id
    version = aws_launch_template.high_performance_template.latest_version
  }

  labels = {
    role        = "high-performance"
    environment = var.environment
    workload    = "trading"
  }

  taint {
    key    = "workload"
    value  = "trading"
    effect = "NO_SCHEDULE"
  }

  depends_on = [
    aws_iam_role_policy_attachment.eks_worker_node_policy,
    aws_iam_role_policy_attachment.eks_cni_policy,
    aws_iam_role_policy_attachment.eks_container_registry_policy,
  ]

  tags = {
    Name = "${var.cluster_name}-high-performance-nodes"
  }
}

# Launch Template for High Performance Nodes
resource "aws_launch_template" "high_performance_template" {
  name_prefix   = "${var.cluster_name}-high-perf-"
  image_id      = data.aws_ssm_parameter.eks_ami_release_version.value
  instance_type = "c5.4xlarge"

  vpc_security_group_ids = [aws_security_group.eks_node_sg.id]

  user_data = base64encode(templatefile("${path.module}/user_data.sh", {
    cluster_name        = var.cluster_name
    bootstrap_arguments = "--container-runtime containerd --b64-cluster-ca ${aws_eks_cluster.mercato_cluster.certificate_authority[0].data} --apiserver-endpoint ${aws_eks_cluster.mercato_cluster.endpoint}"
  }))

  block_device_mappings {
    device_name = "/dev/xvda"
    ebs {
      volume_size           = 100
      volume_type           = "gp3"
      iops                  = 3000
      throughput            = 125
      encrypted             = true
      delete_on_termination = true
    }
  }

  metadata_options {
    http_endpoint = "enabled"
    http_tokens   = "required"
    http_put_response_hop_limit = 2
  }

  monitoring {
    enabled = true
  }

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name = "${var.cluster_name}-high-performance-worker"
    }
  }
}

# General Purpose Node Group
resource "aws_eks_node_group" "general_nodes" {
  cluster_name    = aws_eks_cluster.mercato_cluster.name
  node_group_name = "general-nodes"
  node_role_arn   = aws_iam_role.eks_node_role.arn
  subnet_ids      = aws_subnet.private_subnets[*].id

  instance_types = ["m5.large", "m5.xlarge"]
  capacity_type  = "SPOT"

  scaling_config {
    desired_size = 2
    max_size     = 10
    min_size     = 1
  }

  update_config {
    max_unavailable_percentage = 25
  }

  labels = {
    role        = "general"
    environment = var.environment
    workload    = "general"
  }

  depends_on = [
    aws_iam_role_policy_attachment.eks_worker_node_policy,
    aws_iam_role_policy_attachment.eks_cni_policy,
    aws_iam_role_policy_attachment.eks_container_registry_policy,
  ]

  tags = {
    Name = "${var.cluster_name}-general-nodes"
  }
}

# Data source for EKS AMI
data "aws_ssm_parameter" "eks_ami_release_version" {
  name = "/aws/service/eks/optimized-ami/1.28/amazon-linux-2/recommended/image_id"
}

# OIDC Provider for EKS
data "tls_certificate" "eks_cluster_tls" {
  url = aws_eks_cluster.mercato_cluster.identity[0].oidc[0].issuer
}

resource "aws_iam_openid_connect_provider" "eks_cluster_oidc" {
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = [data.tls_certificate.eks_cluster_tls.certificates[0].sha1_fingerprint]
  url             = aws_eks_cluster.mercato_cluster.identity[0].oidc[0].issuer

  tags = {
    Name = "${var.cluster_name}-oidc"
  }
}
