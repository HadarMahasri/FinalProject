
# 🍕 Full-Stack Pizza Ordering System

A full-stack web application for managing a pizza shop, developed as a **team project (2 developers)**.  
The system supports two user roles: **Customer** and **Employee**, each with dedicated features and dashboards.  

---

## 🚀 Features

### 👤 Customer
- Browse and order products from the menu  
- Track order status in real time (new, in preparation, completed)  
- View order history and past purchases  

### 🧑‍🍳 Employee
- Manage menu items (add, edit, delete)  
- Inventory management with status updates  
- Order workflow management (new, in progress, paid, completed)  
- Dashboard with visual statistics and recent activity reports  

---

## 🛠️ Tech Stack
- **Frontend:** React + custom CSS  
- **Backend:** Node.js (Express)  
- **Database:** MySQL  
- **Architecture:** MVC  
- **Authentication:** JWT  
- **API:** RESTful  

---

## 📂 Project Structure
```
│── client/ # React frontend
│── server/ # Express backend
  └── controllers/ # Application controllers (business logic)
  └── database/ # Database schema and queries
  └── middleware/ # Authentication and other middleware
  └── routes/ # API routes
  └── db.js # Database connection
```
