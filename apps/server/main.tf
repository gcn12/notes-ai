terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}

data "aws_vpc" "default_vpc" {
  default = true
}

data "aws_subnets" "default_subnet" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default_vpc.id]
  }
}

resource "aws_ecs_cluster" "notes_cluster" {
  name = "notes-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

data "aws_iam_role" "ecs_task_execution_role" {
  name = "ecsTaskExecutionRole"
}

resource "aws_ecs_task_definition" "notes_task_definition" {
  family                   = "notes-task-definition"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 512
  memory                   = 1024
  execution_role_arn       = data.aws_iam_role.ecs_task_execution_role.arn
  container_definitions    = <<TASK_DEFINITION
[
  {
    "name": "notes-container",
    "image": "808841774714.dkr.ecr.us-east-1.amazonaws.com/notes",
    "cpu": 512,
    "memory": 1024,
    "essential": true,
    "portMappings": [
      {
        "containerPort": 3006, 
        "hostPort": 3006        
      }
    ]
  }
]
TASK_DEFINITION

  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = "ARM64"
  }
}

resource "aws_security_group" "http_port_security_group" {
  name        = "service-security-group-80"
  description = "Security group allowing traffic on port 80"

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }
}

resource "aws_security_group" "app_port_security_group" {
  name        = "service-security-group-3006"
  description = "Security group allowing traffic on port 3006"

  ingress {
    from_port   = 3006
    to_port     = 3006
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }
}

resource "aws_lb" "notes_lb" {
  name               = "notes-lb"
  internal           = false
  ip_address_type = "ipv4"
  load_balancer_type = "application"
  security_groups    = [aws_security_group.http_port_security_group.id]
  subnets            = data.aws_subnets.default_subnet.ids

  enable_deletion_protection = false
}

resource "aws_lb_target_group" "notes_lb_target_group" {
  name        = "notes-lb-target-group"
  port        = 3006
  protocol    = "HTTP"
  target_type = "ip"
  vpc_id      = data.aws_vpc.default_vpc.id
}

resource "aws_lb_listener" "notes_lb_listener" {
  load_balancer_arn = aws_lb.notes_lb.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.notes_lb_target_group.arn
  }
}

resource "aws_ecs_service" "notes_service" {
  name            = "notes-service"
  cluster         = aws_ecs_cluster.notes_cluster.id
  task_definition = aws_ecs_task_definition.notes_task_definition.arn
  desired_count   = 1
  launch_type = "FARGATE"


  network_configuration {
    security_groups = [ aws_security_group.app_port_security_group.id ]
    subnets = data.aws_subnets.default_subnet.ids
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.notes_lb_target_group.arn
    container_name   = "notes-container"
    container_port   = 3006
  }
}