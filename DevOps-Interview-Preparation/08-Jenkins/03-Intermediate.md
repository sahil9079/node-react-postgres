# Jenkins Fundamentals - Level 2: Intermediate
## 1. Production Declarative Jenkinsfile for Java Maven Application
```groovy
pipeline {
    agent { label 'maven-agent' }
    tools {
        maven 'Maven-3.9'
        jdk 'JDK-17'
    }
    environment {
        AWS_REGION = 'us-east-1'
        ECR_REGISTRY = '123456789012.dkr.ecr.us-east-1.amazonaws.com'
        APP_NAME = 'java-enterprise-api'
        IMAGE_TAG = "${BUILD_NUMBER}"
    }
    stages {
        stage('Checkout') {
            steps {
                git branch: 'main', credentialsId: 'github-creds', url: 'https://github.com/company/java-app.git'
            }
        }
        stage('Build & Test') {
            steps {
                sh 'mvn clean package -DskipTests=false'
            }
            post {
                always {
                    junit '**/target/surefire-reports/*.xml'
                }
            }
        }
        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('SonarQube-Server') {
                    sh 'mvn sonar:sonar -Dsonar.projectKey=java-app'
                }
            }
        }
        stage('Quality Gate') {
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }
        stage('Docker Build & Push') {
            steps {
                sh '''
                    aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_REGISTRY}
                    docker build -t ${ECR_REGISTRY}/${APP_NAME}:${IMAGE_TAG} .
                    docker push ${ECR_REGISTRY}/${APP_NAME}:${IMAGE_TAG}
                '''
            }
        }
        stage('Deploy to EKS') {
            steps {
                sh '''
                    aws eks update-kubeconfig --region ${AWS_REGION} --name prod-cluster
                    kubectl set image deployment/java-app java-app=${ECR_REGISTRY}/${APP_NAME}:${IMAGE_TAG} -n production
                    kubectl rollout status deployment/java-app -n production --timeout=180s
                '''
            }
        }
    }
}
```
