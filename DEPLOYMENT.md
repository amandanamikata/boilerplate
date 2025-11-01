# Deployment Guide

This guide provides step-by-step instructions for deploying the Simple Store application to different cloud providers.

## Table of Contents

1. [Google Kubernetes Engine (GKE)](#google-kubernetes-engine-gke)
2. [Amazon Elastic Kubernetes Service (EKS)](#amazon-elastic-kubernetes-service-eks)
3. [Azure Kubernetes Service (AKS)](#azure-kubernetes-service-aks)
4. [Local Development with Docker Compose](#local-development-with-docker-compose)

---

## Google Kubernetes Engine (GKE)

### Prerequisites
- Google Cloud SDK installed
- Project created in Google Cloud Console
- Billing enabled

### Steps

1. **Set up GCloud CLI**
```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

2. **Create GKE Cluster**
```bash
gcloud container clusters create simple-store-cluster \
  --zone us-central1-a \
  --num-nodes 3 \
  --machine-type n1-standard-2 \
  --enable-autoscaling \
  --min-nodes 2 \
  --max-nodes 5
```

3. **Get Cluster Credentials**
```bash
gcloud container clusters get-credentials simple-store-cluster --zone us-central1-a
```

4. **Build and Push Images to GCR**
```bash
# Enable Container Registry API
gcloud services enable containerregistry.googleapis.com

# Build and push images
cd product-service
docker build -t gcr.io/YOUR_PROJECT_ID/product-service:latest .
docker push gcr.io/YOUR_PROJECT_ID/product-service:latest

# Repeat for other services
```

5. **Update Kubernetes Manifests**
```bash
cd ../k8s
sed -i 's|YOUR_REGISTRY|gcr.io/YOUR_PROJECT_ID|g' *.yaml
```

6. **Deploy Application**
```bash
kubectl apply -f namespace.yaml
kubectl apply -f secrets.yaml -n simple-store
kubectl apply -f mongodb/ -n simple-store
kubectl apply -f product-service.yaml -n simple-store
kubectl apply -f user-service.yaml -n simple-store
kubectl apply -f order-service.yaml -n simple-store
kubectl apply -f api-gateway.yaml -n simple-store
```

7. **Get External IP**
```bash
kubectl get service api-gateway -n simple-store -w
```

---

## Amazon Elastic Kubernetes Service (EKS)

### Prerequisites
- AWS CLI installed and configured
- eksctl installed

### Steps

1. **Create EKS Cluster**
```bash
eksctl create cluster \
  --name simple-store-cluster \
  --region us-west-2 \
  --nodegroup-name standard-workers \
  --node-type t3.medium \
  --nodes 3 \
  --nodes-min 2 \
  --nodes-max 5 \
  --managed
```

2. **Configure kubectl**
```bash
aws eks update-kubeconfig --name simple-store-cluster --region us-west-2
```

3. **Create ECR Repositories**
```bash
aws ecr create-repository --repository-name product-service --region us-west-2
aws ecr create-repository --repository-name user-service --region us-west-2
aws ecr create-repository --repository-name order-service --region us-west-2
aws ecr create-repository --repository-name api-gateway --region us-west-2
```

4. **Build and Push Images to ECR**
```bash
# Get ECR login
aws ecr get-login-password --region us-west-2 | docker login --username AWS --password-stdin ACCOUNT_ID.dkr.ecr.us-west-2.amazonaws.com

# Build and push
cd product-service
docker build -t ACCOUNT_ID.dkr.ecr.us-west-2.amazonaws.com/product-service:latest .
docker push ACCOUNT_ID.dkr.ecr.us-west-2.amazonaws.com/product-service:latest

# Repeat for other services
```

5. **Update Kubernetes Manifests**
```bash
cd ../k8s
sed -i 's|YOUR_REGISTRY|ACCOUNT_ID.dkr.ecr.us-west-2.amazonaws.com|g' *.yaml
```

6. **Deploy Application**
```bash
kubectl apply -f namespace.yaml
kubectl apply -f secrets.yaml -n simple-store
kubectl apply -f mongodb/ -n simple-store
kubectl apply -f product-service.yaml -n simple-store
kubectl apply -f user-service.yaml -n simple-store
kubectl apply -f order-service.yaml -n simple-store
kubectl apply -f api-gateway.yaml -n simple-store
```

---

## Azure Kubernetes Service (AKS)

### Prerequisites
- Azure CLI installed and logged in

### Steps

1. **Create Resource Group**
```bash
az group create --name simple-store-rg --location eastus
```

2. **Create AKS Cluster**
```bash
az aks create \
  --resource-group simple-store-rg \
  --name simple-store-cluster \
  --node-count 3 \
  --enable-addons monitoring \
  --generate-ssh-keys
```

3. **Get Credentials**
```bash
az aks get-credentials --resource-group simple-store-rg --name simple-store-cluster
```

4. **Create ACR and Attach to AKS**
```bash
az acr create --resource-group simple-store-rg --name simplestoreacr --sku Basic
az aks update --name simple-store-cluster --resource-group simple-store-rg --attach-acr simplestoreacr
```

5. **Build and Push Images to ACR**
```bash
# Login to ACR
az acr login --name simplestoreacr

# Build and push
cd product-service
az acr build --registry simplestoreacr --image product-service:latest .

# Repeat for other services
```

6. **Update Kubernetes Manifests**
```bash
cd ../k8s
sed -i 's|YOUR_REGISTRY|simplestoreacr.azurecr.io|g' *.yaml
```

7. **Deploy Application**
```bash
kubectl apply -f namespace.yaml
kubectl apply -f secrets.yaml -n simple-store
kubectl apply -f mongodb/ -n simple-store
kubectl apply -f product-service.yaml -n simple-store
kubectl apply -f user-service.yaml -n simple-store
kubectl apply -f order-service.yaml -n simple-store
kubectl apply -f api-gateway.yaml -n simple-store
```

---

## Local Development with Docker Compose

For local testing without Kubernetes:

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

Access the API at `http://localhost:3000`

---

## GitHub Actions Setup

### Configure Secrets

For any cloud provider, add to GitHub repository secrets:

1. **KUBE_CONFIG**
```bash
cat ~/.kube/config | base64 -w 0
```

2. For GKE, also add:
   - `GCP_PROJECT_ID`
   - `GCP_SA_KEY` (Service Account JSON key)

3. For EKS, also add:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `AWS_REGION`

4. For AKS, also add:
   - `AZURE_CREDENTIALS` (Service Principal JSON)

### Update GitHub Actions Workflow

Modify `.github/workflows/ci-cd.yaml` to use your specific registry:

```yaml
env:
  REGISTRY: gcr.io  # or your ECR/ACR URL
  IMAGE_PREFIX: YOUR_PROJECT_ID
```

---

## Post-Deployment Verification

```bash
# Check all pods are running
kubectl get pods -n simple-store

# Check services
kubectl get services -n simple-store

# Test API Gateway
curl http://EXTERNAL_IP/health

# View logs
kubectl logs -l app=api-gateway -n simple-store --tail=50
```

## Cleanup

### GKE
```bash
gcloud container clusters delete simple-store-cluster --zone us-central1-a
```

### EKS
```bash
eksctl delete cluster --name simple-store-cluster --region us-west-2
```

### AKS
```bash
az group delete --name simple-store-rg --yes --no-wait
```
