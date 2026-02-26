# EcomBazaar — Full-Stack E-Commerce Platform

A production-ready e-commerce system with a **User Frontend**, **Admin Panel**, and **Node.js/Express/MongoDB Backend**.

---

## Project Structure

```
ecombazaar/
 server/               # Backend API (Express + MongoDB)
 client/
    user-frontend/    # User-facing shop (React + Vite, port 5173)
    admin-frontend/   # Admin panel (React + Vite, port 5174)
```

---

## Quick Start

### 1. Prerequisites
- Node.js 18+
- MongoDB running locally or provide a MongoDB Atlas URI in `.env`

### 2. Backend Setup

```bash
cd server
npm install
mkdir uploads
node utils/seeder.js   # creates admin user
npm run dev            # starts on http://localhost:5000
```

### 3. User Frontend

```bash
cd client/user-frontend
npm install
npm run dev            # starts on http://localhost:5173
```

### 4. Admin Frontend

```bash
cd client/admin-frontend
npm install
npm run dev            # starts on http://localhost:5174
```

---

## Access

| App | URL | Credentials |
|-----|-----|-------------|
| User Shop | http://localhost:5173 | Register freely |
| Admin Panel | http://localhost:5174 | admin@store.com / admin123 |
| Backend API | http://localhost:5000/api | — |

> **Mock mode**: Both frontends work offline using built-in sample data when the backend is unavailable.

---

## Features

### User Frontend
- Product browsing with category/price filters and search
- Product detail pages with image gallery and reviews
- Cart (synced to DB when logged in, localStorage for guests)
- Wishlist, Checkout with coupon support
- Order confirmation and history in profile

### Admin Panel
- Dashboard: revenue, orders, user stats with Recharts charts
- Products CRUD with image upload
- Categories, Orders, Users, Reviews management
- Coupons (percentage & fixed discount)
- Analytics with trend charts
- Settings: store info, tax, shipping, payment methods

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, React Router v6, Axios, Recharts |
| Backend | Node.js, Express, MongoDB, Mongoose |
| Auth | JWT, bcryptjs, HTTP-only cookies |
| Uploads | Multer |
