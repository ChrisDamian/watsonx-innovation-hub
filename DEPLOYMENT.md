# Deployment Guide - Watsonx Innovation Hub

This guide provides multiple deployment options for the Watsonx Innovation Hub, from quick GitHub setup to production-ready deployments.

## 🚀 Quick GitHub Deployment

### Option 1: Automated Setup (Recommended)

```bash
# Make the script executable
chmod +x scripts/setup-github-repo.sh

# Run the automated setup
./scripts/setup-github-repo.sh
```

This script will:
- ✅ Check prerequisites (Git, Node.js, GitHub CLI)
- ✅ Initialize Git repository
- ✅ Create GitHub workflows and templates
- ✅ Set up Docker and Kubernetes configurations
- ✅ Create comprehensive documentation
- ✅ Push to GitHub with proper configuration

### Option 2: Quick Deploy

```bash
# Make the script executable
chmod +x scripts/quick-deploy.sh

# Quick deploy (replace 'your-username' with your GitHub username)
./scripts/quick-deploy.sh your-username
```

### Option 3: Manual Setup

1. **Initialize Git Repository**
   ```bash
   git init
   git branch -M main
   git add .
   git commit -m "🎉 Initial commit: Watsonx Innovation Hub"
   ```

2. **Create GitHub Repository**
   - Go to [GitHub](https://github.com/new)
   - Repository name: `watsonx-innovation-hub`
   - Description: `Multi-Industry AI Innovation Hub powered by Watsonx`
   - Choose Public or Private
   - Don't initialize with README, .gitignore, or license

3. **Push to GitHub**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/watsonx-innovation-hub.git
   git push -u origin main
   ```

## 🔧 Repository Configuration

### Required GitHub Secrets

After creating the repository, add these secrets in `Settings > Secrets and variables > Actions`:

```bash
# Watsonx Configuration
WATSONX_API_KEY=your_watsonx_api_key
WATSONX_PROJECT_ID=your_project_id
WATSONX_URL=https://us-south.ml.cloud.ibm.com
WATSONX_REGION=us-south

# Database Configuration
MONGODB_URI=mongodb://your-mongodb-connection
POSTGRES_HOST=your-postgres-host
POSTGRES_USER=your-postgres-user
POSTGRES_PASSWORD=your-postgres-password
REDIS_URL=redis://your-redis-connection

# Security
JWT_SECRET=your-super-secure-jwt-secret-key
ENCRYPTION_KEY=your-32-character-encryption-key

# Mental Health Module Specific
DSM_DATASET_ID=your-dsm-dataset-id
MENTAL_HEALTH_API_KEY=your-mental-health-api-key

# Deployment
DOCKER_REGISTRY=ghcr.io
DOCKER_USERNAME=${{ github.actor }}
DOCKER_PASSWORD=${{ secrets.GITHUB_TOKEN }}
```

### Environment Variables Setup

1. **Copy Environment Files**
   ```bash
   cp .env.example .env
   cp modules/mental-health/.env.mental-health.example modules/mental-health/.env.mental-health
   ```

2. **Configure Core Platform** (`.env`)
   ```bash
   # Server Configuration
   NODE_ENV=development
   PORT=5000
   
   # Watsonx Configuration
   WATSONX_API_KEY=your_api_key_here
   WATSONX_PROJECT_ID=your_project_id_here
   
   # Database URLs
   MONGODB_URI=mongodb://localhost:27017/watsonx-hub
   POSTGRES_HOST=localhost
   REDIS_URL=redis://localhost:6379
   ```

3. **Configure Mental Health Module** (`modules/mental-health/.env.mental-health`)
   ```bash
   # DSM Configuration
   DSM_VERSION=DSM-5-TR
   DSM_DATASET_ID=dsm-5-tr-dataset-2024
   
   # HIPAA Compliance
   HIPAA_COMPLIANCE_MODE=true
   PHI_ENCRYPTION_ENABLED=true
   
   # Multilingual Support
   SUPPORTED_LANGUAGES=en,sw,fr
   DEFAULT_LANGUAGE=en
   ```

## 🐳 Docker Deployment

### Local Development with Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production Docker Build

```bash
# Build production image
docker build -t watsonx-hub:latest .

# Run production container
docker run -d \
  --name watsonx-hub \
  -p 5000:5000 \
  -e NODE_ENV=production \
  -e WATSONX_API_KEY=your_key \
  watsonx-hub:latest
```

### Mental Health Module Docker

```bash
# Build mental health module
docker build -f modules/mental-health/Dockerfile -t watsonx-mental-health .

# Run mental health module
docker run -d \
  --name watsonx-mental-health \
  -p 5001:5001 \
  -e MODULE=mental-health \
  watsonx-mental-health
```

## ☸️ Kubernetes Deployment

### Prerequisites

```bash
# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
chmod +x kubectl
sudo mv kubectl /usr/local/bin/

# Install Helm (optional)
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
```

### Deploy to Kubernetes

1. **Create Namespace**
   ```bash
   kubectl apply -f k8s/namespace.yaml
   ```

2. **Create Secrets**
   ```bash
   kubectl create secret generic watsonx-secrets \
     --from-literal=api-key=your_watsonx_api_key \
     --from-literal=jwt-secret=your_jwt_secret \
     --namespace=watsonx-hub
   ```

3. **Deploy Application**
   ```bash
   kubectl apply -f k8s/
   ```

4. **Check Deployment**
   ```bash
   kubectl get pods -n watsonx-hub
   kubectl get services -n watsonx-hub
   ```

### Scaling

```bash
# Scale API deployment
kubectl scale deployment watsonx-hub-api --replicas=5 -n watsonx-hub

# Auto-scaling
kubectl autoscale deployment watsonx-hub-api \
  --cpu-percent=70 \
  --min=2 \
  --max=10 \
  -n watsonx-hub
```

## 🌐 Cloud Platform Deployments

### IBM Cloud

```bash
# Install IBM Cloud CLI
curl -fsSL https://clis.cloud.ibm.com/install/linux | sh

# Login and target
ibmcloud login
ibmcloud target -g your-resource-group

# Deploy to IBM Cloud Kubernetes Service
ibmcloud ks cluster config --cluster your-cluster-name
kubectl apply -f k8s/
```

### AWS EKS

```bash
# Install AWS CLI and eksctl
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip && sudo ./aws/install

# Create EKS cluster
eksctl create cluster --name watsonx-hub --region us-west-2

# Deploy application
kubectl apply -f k8s/
```

### Google Cloud GKE

```bash
# Install Google Cloud SDK
curl https://sdk.cloud.google.com | bash

# Create GKE cluster
gcloud container clusters create watsonx-hub \
  --zone us-central1-a \
  --num-nodes 3

# Deploy application
kubectl apply -f k8s/
```

### Azure AKS

```bash
# Install Azure CLI
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Create AKS cluster
az aks create \
  --resource-group watsonx-rg \
  --name watsonx-hub \
  --node-count 3 \
  --enable-addons monitoring

# Deploy application
kubectl apply -f k8s/
```

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

The repository includes comprehensive GitHub Actions workflows:

- **CI Pipeline** (`.github/workflows/ci-cd.yml`)
  - Runs tests on Node.js 18.x and 20.x
  - Performs security scanning
  - Builds and pushes Docker images
  - Deploys to staging/production

- **Mental Health Module** (`.github/workflows/mental-health-module.yml`)
  - Specialized testing for mental health module
  - DSM validation tests
  - HIPAA compliance checks

### Triggering Deployments

```bash
# Trigger deployment via git push
git push origin main

# Create release for production deployment
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

## 📊 Monitoring and Observability

### Health Checks

```bash
# Check application health
curl http://localhost:5000/health

# Check mental health module
curl http://localhost:5001/health
```

### Logging

```bash
# View application logs
docker logs watsonx-hub

# View Kubernetes logs
kubectl logs -f deployment/watsonx-hub-api -n watsonx-hub
```

### Metrics

The platform includes built-in metrics endpoints:
- `/metrics` - Prometheus metrics
- `/health` - Health check endpoint
- `/api/governance/audit-logs` - Audit trail

## 🔒 Security Considerations

### Production Security Checklist

- [ ] Update all default passwords and API keys
- [ ] Enable HTTPS with valid SSL certificates
- [ ] Configure firewall rules and network security
- [ ] Set up monitoring and alerting
- [ ] Enable audit logging
- [ ] Configure backup and disaster recovery
- [ ] Perform security scanning and penetration testing
- [ ] Review and update access controls
- [ ] Implement data encryption at rest and in transit
- [ ] Configure HIPAA compliance for mental health data

### HIPAA Compliance Setup

```bash
# Run HIPAA compliance setup for mental health module
cd modules/mental-health
bash scripts/security-setup.sh
```

## 🚨 Troubleshooting

### Common Issues

1. **Docker Build Fails**
   ```bash
   # Clear Docker cache
   docker system prune -a
   
   # Rebuild with no cache
   docker build --no-cache -t watsonx-hub .
   ```

2. **Database Connection Issues**
   ```bash
   # Check database connectivity
   npm run db:test
   
   # Reset database
   npm run db:reset
   ```

3. **Watsonx API Issues**
   ```bash
   # Test Watsonx connection
   npm run test:watsonx
   
   # Verify API key
   echo $WATSONX_API_KEY
   ```

4. **Mental Health Module Issues**
   ```bash
   # Run module-specific tests
   npm run test:mental-health
   
   # Check DSM dataset
   npm run dsm:validate
   ```

### Getting Help

- 📖 Check the [README.md](README.md) for detailed documentation
- 🐛 Create an issue on GitHub for bugs
- 💬 Use GitHub Discussions for questions
- 📧 Contact support for urgent issues

## 📈 Scaling and Performance

### Performance Optimization

1. **Database Optimization**
   - Enable connection pooling
   - Add database indexes
   - Configure read replicas

2. **Caching Strategy**
   - Redis for session storage
   - Application-level caching
   - CDN for static assets

3. **Load Balancing**
   - Multiple application instances
   - Database load balancing
   - Geographic distribution

### Monitoring Performance

```bash
# Monitor resource usage
kubectl top pods -n watsonx-hub

# Check application metrics
curl http://localhost:5000/metrics
```

## 🎯 Next Steps

After successful deployment:

1. **Configure Watsonx Integration**
   - Set up your Watsonx project
   - Upload training datasets
   - Deploy AI models

2. **Customize for Your Use Case**
   - Modify industry modules
   - Add custom governance rules
   - Integrate with existing systems

3. **Set Up Monitoring**
   - Configure alerting
   - Set up dashboards
   - Enable audit logging

4. **Security Hardening**
   - Perform security audit
   - Configure compliance settings
   - Set up backup procedures

5. **Team Onboarding**
   - Add team members
   - Configure access controls
   - Provide training materials

Happy deploying! 🚀