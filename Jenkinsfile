pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Docker Build') {
            steps {
                bat 'set DOCKER_BUILDKIT=1 && docker build -t saleor-app:latest .'
            }
        }

        stage('Docker Build') {
    steps {
        bat 'setlocal & set DOCKER_BUILDKIT=1 && docker build -t saleor-app:latest .'
    }
}

    }

    post {
        always {
            echo "Pipeline finished"
        }
    }
}
