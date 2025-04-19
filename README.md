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
