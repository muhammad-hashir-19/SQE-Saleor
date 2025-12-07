# Deployment Instructions

**Application**: Saleor E-commerce
**Hosting**: AWS Elastic Beanstalk
**CI/CD**: GitHub Actions

## 1. Prerequisites
Before deploying, ensure the following are configured in your GitHub Repository Secrets:
- `AWS_ACCESS_KEY_ID`: AWS credential with permissions for Elastic Beanstalk and S3.
- `AWS_SECRET_ACCESS_KEY`: Corresponding secret key.
- `SENTRY_DSN` (Optional): For error tracking in Production.

## 2. Deployment Pipeline Overview
We utilize a continuous delivery pipeline defined in `.github/workflows/student-build.yml`.
The pipeline consists of four stages:
1.  **Build**: Installs dependencies, builds static assets, and packages the application (`deployment.zip`).
2.  **Test**: Runs integration tests in a Dockerized environment.
3.  **Deploy to Staging**: Automatically deploys to the `Sqe-env` environment on AWS Elastic Beanstalk.
4.  **Deploy to Production**: Automatically deploys to the `Sqe-prod-env` environment (after Staging succeeds).

## 3. How to Deploy

### 3.1 trigger Deployment
Deployment is **fully automated**. To trigger a deployment:

1.  **Commit your changes** to the repository.
2.  **Push** to the `main` branch.
    ```bash
    git add .
    git commit -m "feat: add new payment gateway"
    git push origin main
    ```

### 3.2 Monitoring Deployment
1.  Go to the **Actions** tab in your GitHub repository.
2.  Click on the latest workflow run titled "CI/CD Pipeline".
3.  Monitor the steps:
    - Watch for `integration-tests` to pass.
    - Watch for `deploy-staging` to complete.
    - Watch for `deploy-production` to complete.

## 4. Environment Details

### Staging Environment
- **URL**: `http://sqe-env.eba-xxxx.us-east-1.elasticbeanstalk.com` (Example)
- **AWS Region**: `us-east-1`
- **Application Name**: `sqe`
- **Environment Name**: `Sqe-env`
- **Bucket**: `elasticbeanstalk-us-east-1-452323163510`

### Production Environment
- **URL**: `http://sqe-prod-env.eba-xxxx.us-east-1.elasticbeanstalk.com` (Example)
- **AWS Region**: `us-east-1`
- **Application Name**: `Sqe-prod`
- **Environment Name**: `Sqe-prod-env`

## 5. Troubleshooting
If the deployment fails:
1.  **Check GitHub Action Logs**: Identify which step failed (e.g., Tests or AWS CLI command).
2.  **Check AWS Elastic Beanstalk Logs**:
    - Go to AWS Console -> Elastic Beanstalk -> Environment -> Logs.
    - Request "Last 100 lines" to see application startup errors.
3.  **Common Issues**:
    - *Tests Failed*: Fix the code and push again.
    - *Deployment Timeout*: AWS might be slow; retry the job in GitHub.
    - *502 Bad Gateway*: Usually a Django startup error. Check `stdout` logs in AWS.
