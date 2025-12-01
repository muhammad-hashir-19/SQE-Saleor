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

        stage('Docker Build & Run (Optional)') {
            when {
                expression { !isUnix() ? false : true } // Skip Docker stages on Windows
            }
            steps {
                bat """
                set DOCKER_BUILDKIT=1
                docker build -t saleor-app:latest .
                docker run -d -p 8000:8000 --name saleor-app saleor-app:latest
                """
            }
        }
    }

    post {
        success {
            echo 'Build completed successfully!'
        }
        failure {
            echo 'Build failed. Check logs!'
        }
    }
}
