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
                bat 'uv sync || true'
                bat 'uv run python manage.py collectstatic --noinput || true'
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
            echo "Pipeline finished "
        }
    }
}
