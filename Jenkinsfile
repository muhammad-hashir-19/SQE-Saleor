pipeline {
    agent any

    environment {
        SECRET_KEY = "dummy"
        STATIC_URL = "/static/"
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Setup Python & uv') {
            steps {
                bat """
                python -m pip install --upgrade pip
                python -m pip install uv
                """
            }
        }

        stage('UV Sync & Install Dependencies (Skip Dev)') {
            steps {
                bat """
                uv sync --no-dev
                """
            }
        }

        stage('Collect Static') {
            steps {
                bat """
                python manage.py collectstatic --noinput
                """
            }
        }

        stage('Docker Build') {
            steps {
                bat """
                set DOCKER_BUILDKIT=1
                docker build -t saleor-app:latest .
                """
            }
        }

        stage('Docker Run') {
            steps {
                bat """
                docker run -d -p 8000:8000 --name saleor-app saleor-app:latest
                """
            }
        }
    }

    post {
        always {
            echo "Pipeline finished"
        }
        success {
            echo "Build and Docker run succeeded!"
        }
        failure {
            echo "Build failed. Check logs!"
        }
    }
}
