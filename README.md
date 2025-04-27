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
- Token refresh and blacklisting via Redis.

### **🔹 Restaurant Management**  
- Restaurant Admins can **add, update, delete** menu items.  
- Set restaurant **availability & manage orders**.  
- View comprehensive **reports** on food items and orders.

### **🔹 Order Management**  
- Customers can **browse menus**, add items to a **cart**, and place orders.  
- Modify orders before confirmation.  
- Track order **status** in real-time.  
- Integrated payment processing with options for card payments or cash on delivery.

### **🔹 Delivery Management**  
- Restaurant admins can **assign orders** to delivery personnel.  
- Delivery personnel can update delivery status (accepted, picked up, delivered).  
- Customers can **track delivery progress** in real-time.  

### **🔹 Real-time Notifications**  
- Customers receive notifications about order status changes.
- Socket.io used for real-time delivery updates.
- Notification service handles both order and delivery status updates.

---

## 📌 Tech Stack  
### **🔹 Frontend:**  
- **React.js** with **Material UI** for responsive interfaces
- **Redux** for state management  

### **🔹 Backend Microservices:**  
- **Auth Service**: Handles user authentication, authorization, and role management
- **Restaurant Service**: Manages food items and restaurant data
- **Order Service**: Handles order creation, payment processing, and delivery management
- **Notification Service**: Handles real-time notifications for various events

### **🔹 Infrastructure & Deployment:**  
- **Docker** (Containerization)  
- **Kubernetes** (Microservices Orchestration)  
- **MongoDB Atlas** (Database)
- **Redis** (Token blacklisting and caching)
- **Socket.io** (Real-time notifications)

---

## 📌 Environment Setup  

### **1️⃣ Prerequisites**  
Ensure you have the following installed:  
- **Node.js** (v16+) → [Download Here](https://nodejs.org/)  
- **MongoDB** (Local or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))  
- **Docker & Kubernetes** → [Install Guide](https://kubernetes.io/docs/setup/)  
- **Redis** → [Download Here](https://redis.io/download)
- **Postman** (For API testing)  

---

### **2️⃣ Clone the Repository**
```bash
git clone https://github.com/yourusername/food-ordering-system.git
cd food-ordering-system
```

## Project Structure

```
├── frontend/                 # React frontend application
├── backend/                  # Backend services
│   ├── auth-service/         # Authentication and user management
│   ├── order-service/        # Order, payment & delivery management
│   ├── restaurant-service/   # Food items and restaurant management
│   └── notification-service/ # Real-time notifications
├── docker-compose.yml        # Docker Compose configuration
└── kubernetes/               # Kubernetes deployment files
```

## Service Architecture

### Auth Service (Port 3001)
- **User Authentication**: Login, registration, logout, and token management
- **Role Management**: Controls access for customers, restaurant admins, and delivery personnel
- **Token Management**: JWT token generation, validation, and refresh
- Uses Redis for token blacklisting and session management

### Restaurant Service (Port 3002)
- **Menu Management**: Create, update, and delete food items
- **Food Items**: Manage restaurant menu offerings
- **Public Access**: Public endpoints for customers to browse menus

### Order Service (Port 3003)
- **Order Processing**: Create and track orders
- **Order Status Management**: Update order status (placed, paid, delivered)
- **Payment Processing**: Integrated payment handling (card or cash on delivery)
- **Delivery Management**: Assign orders to delivery personnel and track delivery status

### Notification Service (Port 3006)
- **Notifications**: Send notifications for various events
- **Real-time Updates**: Socket.io integration for real-time updates
- **Delivery Status Notifications**: Updates about delivery status changes
- **Order Status Notifications**: Updates about order status changes

## Database Configuration

This application uses MongoDB Atlas as its database. The connection details are configured in:
- `docker-compose.yml` for Docker deployment
- `kubernetes/secrets.yaml` for Kubernetes deployment (base64 encoded)

## Local Development

### Prerequisites

- Node.js (v16+)
- npm or yarn
- MongoDB Atlas account (or change the connection strings to use a local MongoDB)
- Redis (for token management)

### Installation

Install dependencies for all services:

```bash
# Install frontend dependencies
cd frontend && npm install

# Install backend service dependencies
cd ../backend/auth-service && npm install
cd ../order-service && npm install
cd ../restaurant-service && npm install
cd ../notification-service && npm install
```

### Running the Application Locally

Start each service individually:

```bash
# Frontend
cd frontend && npm start

# Auth Service
cd backend/auth-service && npm start

# Order Service
cd backend/order-service && npm start

# Restaurant Service
cd backend/restaurant-service && npm start

# Notification Service
cd backend/notification-service && npm start
```

## Docker Deployment

Build and run the entire application using Docker Compose:

```bash
# Build and start containers
docker-compose up --build

# Run in detached mode
docker-compose up -d

# Stop containers
docker-compose down
```

## Kubernetes Deployment

For detailed instructions on Kubernetes deployment, see [kubernetes/README.md](kubernetes/README.md).

Deploy to Kubernetes:

```bash
# Apply all manifests
kubectl apply -f kubernetes/namespace.yaml
kubectl apply -f kubernetes/secrets.yaml
kubectl apply -f kubernetes/auth-service-deployment.yaml
kubectl apply -f kubernetes/order-service-deployment.yaml
kubectl apply -f kubernetes/restaurant-service-deployment.yaml
kubectl apply -f kubernetes/notification-service-deployment.yaml
kubectl apply -f kubernetes/frontend-deployment.yaml
kubectl apply -f kubernetes/ingress.yaml
```

## Accessing the Application

- Local development: [http://localhost:3000](http://localhost:3000)
- Docker: [http://localhost:3000](http://localhost:3000)
- Kubernetes: [http://food-ordering.local](http://food-ordering.local) (after configuring your hosts file)

## API Endpoints

### Auth Service (Port 3001)
- `/api/auth/register` - Register a new user
- `/api/auth/login` - Login user
- `/api/auth/logout` - Logout user
- `/api/auth/refresh` - Refresh authentication token
- `/api/auth/me` - Get current user data
- `/api/auth/change-password` - Change user password

### Restaurant Service (Port 3002)
- `/api/food-items` - Food menu items management (Restaurant Admin only)
- `/api/food-items/public` - Public food items for customers
- `/api/food-items/:id` - Get, update, or delete specific food item

### Order Service (Port 3003)
- `/api/orders` - Get user orders or create new order
- `/api/orders/:id` - Get or delete specific order
- `/api/orders/restaurant` - Get orders for restaurant admin
- `/api/orders/delivery/assigned` - Get assigned orders for delivery personnel
- `/api/orders/:id/payment` - Update order payment
- `/api/orders/:id/status` - Update order status
- `/api/orders/:id/assign` - Assign order to delivery personnel
- `/api/orders/:id/delivery-status` - Update delivery status

### Notification Service (Port 3006)
- `/api/notifications` - Create notification (service-to-service auth)
- `/api/notifications/user/:userId` - Get notifications for specific user
- `/api/delivery-notifications/status-update` - Create delivery status notification
- `/api/delivery-notifications/order-status` - Create order status notification