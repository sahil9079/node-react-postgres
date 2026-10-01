# Project 2: Enterprise DevOps CI/CD Pipeline for Three-Tier Java Application

## 1. Project Overview (From Resume)
* **Stack:** Java Enterprise backend, Apache Tomcat, MySQL Database, Nginx Reverse Proxy.
* **CI/CD:** Git, Jenkins Distributed Master-Agent Architecture, Maven, SonarQube, Checkstyle, Docker, Amazon ECR, AWS EKS/Kubernetes.

## 2. CI/CD Pipeline Flow
1. Git Webhook triggers Jenkins Declarative Pipeline on EC2 agent.
2. Maven executes `mvn clean test` (JUnit test suite) and Checkstyle linting.
3. SonarQube Scanner executes static analysis and waits for Quality Gate approval.
4. Docker builds application image and authenticates to Amazon ECR.
5. Trivy scans the packaged container image.
6. Kubernetes deployment rolling update executed via `kubectl set image` on EKS.
