#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Build Docker images
echo "Building Docker images..."
docker build -t food-ordering-frontend:latest ./frontend
docker build -t food-ordering-order-service:latest ./backend/order-service
docker build -t food-ordering-auth-service:latest ./backend/auth-service
docker build -t food-ordering-restaurant-service:latest ./backend/restaurant-service

# Create namespace if it doesn't exist
echo "Creating Kubernetes namespace..."
kubectl apply -f kubernetes/namespace.yaml

# Apply secrets
echo "Applying secrets..."
kubectl apply -f kubernetes/secrets.yaml

# Deploy backend services (using MongoDB Atlas)
echo "Deploying backend services..."
kubectl apply -f kubernetes/auth-service-deployment.yaml
kubectl apply -f kubernetes/order-service-deployment.yaml
kubectl apply -f kubernetes/restaurant-service-deployment.yaml

# Wait for backend services to be ready
echo "Waiting for backend services to be ready..."
kubectl wait --namespace=food-ordering-system \
  --for=condition=ready pod \
  --selector=app=auth-service \
  --timeout=120s
kubectl wait --namespace=food-ordering-system \
  --for=condition=ready pod \
  --selector=app=order-service \
  --timeout=120s
kubectl wait --namespace=food-ordering-system \
  --for=condition=ready pod \
  --selector=app=restaurant-service \
  --timeout=120s

# Deploy frontend
echo "Deploying frontend..."
kubectl apply -f kubernetes/frontend-deployment.yaml

# Apply ingress
echo "Applying ingress rules..."
kubectl apply -f kubernetes/ingress.yaml

echo "Deployment completed successfully!"
echo "To access the application, add the following line to your /etc/hosts file:"
echo "127.0.0.1 food-ordering.local"
echo "Then open your browser and navigate to http://food-ordering.local" 