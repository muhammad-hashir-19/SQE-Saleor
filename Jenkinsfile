pipeline {
    agent any

    environment {
        SECRET_KEY = "dummy"
        STATIC_URL = "/static/"
    }

    stages {
        stage('Source Stage') {
            steps {
                checkout scm
            }
        }

        stage('Build Stage') {
            steps {
                // Install uv if needed
                bat 'pip install --upgrade pip'
                bat 'pip install uv'

                // Run uv commands
                bat 'uv sync'
                bat 'uv run python manage.py collectstatic --noinput'
            }
        }

        stage('Archive Artifacts') {
            steps {
                archiveArtifacts artifacts: '**/dist/**', allowEmptyArchive: true
            }
        }

        stage('Docker Build') {
            when {
                expression { fileExists('Dockerfile') }
            }
            steps {
                bat 'docker build -t saleor-app:latest .'
            }
        }
    }

    post {
        always {
            echo "Pipeline finished"
        }
    }
}
