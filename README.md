# 🍔 Cloud-Native Food Ordering & Delivery System  

## 🚀 Project Overview  
This project is a **Cloud-Native Food Ordering & Delivery System** built using the **MERN stack** with a **Microservices Architecture**. The platform allows customers to browse restaurants, place orders, make payments, and track deliveries in real-time. Restaurant owners can manage their menus and orders, while delivery personnel can track and complete deliveries.  

The project follows **best practices in microservices**, including **Docker containerization**, **Kubernetes orchestration**, **secure authentication (JWT)**, and **real-time notifications** via email/SMS.  

---

## 📌 Features & Functionalities  

### **🔹 User Authentication & Role Management**  
- Customers, Restaurant Admins, and Delivery Personnel have distinct roles.  
- Secure authentication using **JWT (JSON Web Tokens)**.  
- Role-based access control (**RBAC**) to restrict functionalities.  

### **🔹 Restaurant Management**  
- Restaurant Admins can **add, update, delete** menu items.  
- Set restaurant **availability & manage orders**.  

### **🔹 Order Management**  
- Customers can **browse menus**, add items to a **cart**, and place orders.  
- Modify orders before confirmation.  
- Track order **status** in real-time.  

### **🔹 Delivery Management**  
- Orders are **automatically assigned** to delivery personnel.  
- Customers can **track delivery progress** in real-time.  

### **🔹 Secure Payment Integration**  
- Payment gateways such as **PayHere, Stripe, Dialog Genie** are integrated.  
- Secure payment processing & order confirmation upon successful transactions.  

### **🔹 Real-time Notifications**  
- Customers receive **email & SMS confirmations** after placing an order.  
- Delivery personnel receive notifications when an order is assigned.  

---

## 📌 Tech Stack  
### **🔹 Frontend:**  
- **React.js** (User Interface)  
- **Redux** (State Management)  

### **🔹 Backend Microservices:**  
- **Node.js & Express.js** (REST APIs)  
- **MongoDB** (Database)  
- **JWT Authentication** (Security)  

### **🔹 Infrastructure & Deployment:**  
- **Docker** (Containerization)  
- **Kubernetes** (Microservices Orchestration)  
- **Postman** (API Testing)  

---

## 📌 Environment Setup  

### **1️⃣ Prerequisites**  
Ensure you have the following installed:  
- **Node.js** (v16+) → [Download Here](https://nodejs.org/)  
- **MongoDB** (Local or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))  
- **Docker & Kubernetes** → [Install Guide](https://kubernetes.io/docs/setup/)  
- **Postman** (For API testing)  

---

### **2️⃣ Clone the Repository**
```bash
git clone https://github.com/yourusername/food-delivery-platform.git
cd food-delivery-platform

```

## Project Structure

```
├── frontend/                 # React frontend application
├── backend/                  # Backend services
│   ├── auth-service/         # Authentication and user management
│   ├── order-service/        # Order and cart management
│   └── restaurant-service/   # Food items and restaurant management
├── docker-compose.yml        # Docker Compose configuration
└── kubernetes/               # Kubernetes deployment files
```

## Database Configuration

This application uses MongoDB Atlas as its database. The connection details are configured in:
- `docker-compose.yml` for Docker deployment
- `kubernetes/secrets.yaml` for Kubernetes deployment (base64 encoded)

## Local Development

### Prerequisites

- Node.js (v16+)
- npm or yarn
- MongoDB Atlas account (or change the connection strings to use a local MongoDB)

### Installation

Install all dependencies:

```bash
npm run install:all
```

### Running the Application Locally

Start all services:

```bash
npm start
```

Or start services individually:

```bash
# Frontend
npm run start:frontend

# Auth Service
npm run start:auth-service

# Order Service
npm run start:order-service

# Restaurant Service
npm run start:restaurant-service
```

## Docker Deployment

### Prerequisites

- Docker and Docker Compose

### Running with Docker

Build and start the application:

```bash
# Build Docker images
npm run docker:build

# Start all services
npm run docker:up
```

Stop the application:

```bash
npm run docker:down
```

## Kubernetes Deployment

### Prerequisites

- Docker
- Kubernetes cluster (Minikube, Docker Desktop, or a cloud provider)
- kubectl

### Deployment

Build Docker images and deploy to Kubernetes:

```bash
# Build all Docker images
npm run k8s:build-images

# Deploy to Kubernetes
npm run k8s:deploy
```

### Manual Deployment

Apply Kubernetes manifests:

```bash
npm run k8s:apply
```

### Check Status

```bash
npm run k8s:status
```

### Cleanup

```bash
npm run k8s:delete
```

For more detailed instructions on Kubernetes deployment, see [kubernetes/README.md](kubernetes/README.md).

## Accessing the Application

- Local development: [http://localhost:3000](http://localhost:3000)
- Docker: [http://localhost:3000](http://localhost:3000)
- Kubernetes: [http://food-ordering.local](http://food-ordering.local) (after configuring your hosts file)

## API Endpoints

### Auth Service (Port 3001)
- `/api/auth/register` - Register a new user
- `/api/auth/login` - Login user

### Order Service (Port 3003)
- `/api/cart` - Cart operations
- `/api/orders` - Order management
- `/api/addresses` - User address management

### Restaurant Service (Port 3002)
- `/api/food-items` - Food menu items