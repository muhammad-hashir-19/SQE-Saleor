pipeline {
    agent any

    environment {
        PYTHON_VERSION = 'python'
        UV_SKIP = 'memray'       // Skip memray on Windows
        UV_NO_DEV = '1'          // Skip dev dependencies
    }

    stages {

        stage('Checkout SCM') {
            steps {
                checkout scm
            }
        }

        stage('Setup Python & UV') {
            steps {
                bat """
                ${env.PYTHON_VERSION} -m pip install --upgrade pip
                ${env.PYTHON_VERSION} -m pip install uv
                """
            }
        }

        stage('UV Sync & Install Dependencies') {
            steps {
                bat """
                REM Skip memray and sync prod dependencies
                set UV_SKIP=%UV_SKIP%
                uv sync --no-dev

                REM Install setuptools & wheel to fix pkg_resources
                ${env.PYTHON_VERSION} -m pip install --upgrade setuptools wheel
                """
            }
        }

        stage('Collect Static') {
            steps {
                bat """
                REM Run collectstatic inside uv virtual env
                uv run ${env.PYTHON_VERSION} manage.py collectstatic --noinput
                """
            }
        }

       stage('Docker Build (Windows Safe)') {
            when {
                expression { fileExists('Dockerfile') }
            }
            steps {
                script {
                    echo "Checking if Docker is available..."

                    // Check Docker status first
                    def dockerOk = bat(
                        script: 'docker info >nul 2>&1',
                        returnStatus: true
                    )

                    if (dockerOk == 0) {
                        echo "Docker is running. Building image..."
                        bat 'docker build -t saleor-app:latest .'
                    } else {
                        echo "⚠️ Docker is NOT running. Skipping Docker build to avoid pipeline failure."
                    }
                }
            }
        }
    }

    post {
        always {
            echo "Pipeline finished!"
        }
    }
}