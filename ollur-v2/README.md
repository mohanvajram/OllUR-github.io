# 🛒 OllUR — Your Local Grocery Store

OllUR is a full-stack local grocery directory app that connects customers with their neighbourhood kirana stores. Customers can browse products by category, add items to cart, and choose between **Home Delivery** or **Pick & Drop** service. Shopkeepers get a dedicated dashboard to manage inventory and handle orders.

---

## ✨ Features

### 👤 Customer
- Browse products grouped by category (Rice & Grains, Dals, Snacks, Water, Juice, Fresh Vegetables, Fruits, Dairy, Spices, Oil, Flour, Household)
- Search products by name
- Add to cart with quantity controls (+ / −)
- Checkout with **Home Delivery** or **Pick & Drop**
- View order history and status

### 🏪 Shopkeeper
- Separate login & dashboard
- Add, edit, delete products with category, price, stock, unit
- View and manage all incoming orders
- Update order status (Pending → Confirmed → Ready → Delivered)
- Revenue stats at a glance

---

## 🗂️ Tech Stack

| Layer | Tech |
|-------|------|
| Backend | Python 3.11+, FastAPI, SQLite |
| Frontend | React 18, React Router v6, Axios |
| Build Tool | Vite |
| Styling | Custom CSS with CSS variables |
| Auth | JWT (custom HMAC implementation) |

---

## 📁 Project Structure

```
ollur/
├── backend/
│   ├── main.py          # FastAPI app, all routes
│   ├── database.py      # SQLite setup + seed data
│   ├── models.py        # Pydantic models
│   ├── auth.py          # JWT + password hashing
│   └── requirements.txt
│
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── package.json
    └── src/
        ├── App.jsx
        ├── main.jsx
        ├── index.css
        ├── components/
        │   ├── Navbar.jsx / .css
        │   └── ProductCard.jsx / .css
        ├── pages/
        │   ├── LoginPage.jsx
        │   ├── RegisterPage.jsx
        │   ├── ShopPage.jsx / .css
        │   ├── CheckoutPage.jsx / .css
        │   ├── OrdersPage.jsx / .css
        │   └── ShopkeeperDashboard.jsx / .css
        ├── context/
        │   ├── AuthContext.jsx
        │   └── CartContext.jsx
        └── utils/
            └── api.js
```

---

## 🚀 Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- Git

---

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/ollur.git
cd ollur
```

### 2. Start the Backend

```bash
cd backend
python -m venv venv

# Mac/Linux:
source venv/bin/activate
# Windows:
venv\Scripts\activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Backend runs at: `http://localhost:8000`
API docs at: `http://localhost:8000/docs`

### 3. Start the Frontend

```bash
# Open a new terminal
cd frontend
npm install
npm run dev
```

Frontend runs at: `http://localhost:3000`

---

## 🔑 Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| 🏪 Shopkeeper | shop@ollur.com | shop123 |
| 🧑 Customer | customer@ollur.com | cust123 |

These are auto-created with 35 seeded products on first run.

---

## 🛍️ Product Categories

| Icon | Category |
|------|----------|
| 🌾 | Rice & Grains |
| 🫘 | Dals & Pulses |
| 🍿 | Snacks |
| 💧 | Water & Drinks |
| 🧃 | Juice & Beverages |
| 🥦 | Fresh Vegetables |
| 🍎 | Fresh Fruits |
| 🥛 | Dairy & Eggs |
| 🌶️ | Spices & Masala |
| 🫙 | Oil & Ghee |
| 🌿 | Flour & Atta |
| 🧹 | Household |

---

## 📡 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login, returns JWT |
| GET | `/auth/me` | Get current user |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/products` | List all products (filterable) |
| GET | `/products/{id}` | Get single product |
| POST | `/products` | Add product (shopkeeper only) |
| PUT | `/products/{id}` | Update product (shopkeeper only) |
| DELETE | `/products/{id}` | Delete product (shopkeeper only) |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/orders` | Place order (customer only) |
| GET | `/orders/my` | Get my orders |
| PUT | `/orders/{id}/status` | Update order status (shopkeeper only) |

---

## 🔧 Pushing to GitHub

```bash
# In the project root
git init
git add .
git commit -m "Initial commit: OllUR full-stack grocery app"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/ollur.git
git push -u origin main
```

---

## 📄 License

MIT — feel free to use, modify, and distribute.
