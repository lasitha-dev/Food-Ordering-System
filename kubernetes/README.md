# Food Ordering System - Kubernetes Deployment

This directory contains Kubernetes manifests for deploying the Food Ordering System.

## Prerequisites

- Docker installed and running
- Kubernetes cluster (Minikube, Docker Desktop, or a cloud provider)
- kubectl configured to work with your cluster
- Nginx Ingress Controller installed in your cluster
- MongoDB Atlas account (the application is configured to use MongoDB Atlas)

## Setup

### 1. Install Minikube (if you don't have a Kubernetes cluster)

```bash
# Install Minikube
# On macOS
brew install minikube

# On Windows (with chocolatey)
choco install minikube

# On Linux
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube

# Start Minikube
minikube start

# Enable ingress addon
minikube addons enable ingress
```

### 2. Build and Deploy

```bash
# Make the build script executable
chmod +x kubernetes/build-and-deploy.sh

# Run the build and deploy script
./kubernetes/build-and-deploy.sh
```

### 3. Configure Local DNS (for development)

Add the following line to your hosts file:

```
127.0.0.1 food-ordering.local
```

- On macOS/Linux: `/etc/hosts`
- On Windows: `C:\Windows\System32\drivers\etc\hosts`

### 4. Access the Application

If using Minikube, run:

```bash
minikube tunnel
```

Then open your browser and navigate to:

```
http://food-ordering.local
```

## MongoDB Atlas Configuration

This application uses MongoDB Atlas as its database. The connection URI is stored as a Kubernetes secret.

The connection string is specified in:
- `kubernetes/secrets.yaml` - Base64 encoded for Kubernetes
- `docker-compose.yml` - In plain text for local development

## Manual Deployment

If you prefer to deploy manually:

```bash
# Create namespace
kubectl apply -f kubernetes/namespace.yaml

# Apply secrets
kubectl apply -f kubernetes/secrets.yaml

# Deploy backend services
kubectl apply -f kubernetes/auth-service-deployment.yaml
kubectl apply -f kubernetes/order-service-deployment.yaml
kubectl apply -f kubernetes/restaurant-service-deployment.yaml

# Deploy frontend
kubectl apply -f kubernetes/frontend-deployment.yaml

# Apply ingress
kubectl apply -f kubernetes/ingress.yaml
```

## Monitoring

Check the status of deployments:

```bash
kubectl get all -n food-ordering-system
```

View logs from a service:

```bash
kubectl logs -n food-ordering-system deployment/frontend
kubectl logs -n food-ordering-system deployment/order-service
```

## Cleanup

To remove all resources:

```bash
kubectl delete namespace food-ordering-system
```

## Scaling

To scale a service:

```bash
kubectl scale -n food-ordering-system deployment/order-service --replicas=3
``` 