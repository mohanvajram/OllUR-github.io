from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from database import init_db, get_db
from models import (
    UserCreate, UserLogin, UserOut,
    ProductCreate, ProductUpdate, ProductOut,
    OrderCreate, OrderOut, OrderStatusUpdate,
    KhataEntryCreate, RecurringOrderCreate,
    GroupOrderCreate, GroupOrderJoin,
    RestockAlertCreate, BundleCreate
)
from auth import hash_password, verify_password, create_token, decode_token
from typing import Optional
import json, random, re

app = FastAPI(title="OllUR Enhanced API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()

@app.on_event("startup")
def startup():
    init_db()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    payload = decode_token(credentials.credentials)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return payload

def require_shopkeeper(user=Depends(get_current_user)):
    if user["role"] != "shopkeeper":
        raise HTTPException(status_code=403, detail="Shopkeeper access required")
    return user

def require_customer(user=Depends(get_current_user)):
    if user["role"] != "customer":
        raise HTTPException(status_code=403, detail="Customer access required")
    return user

# AUTH
@app.post("/auth/register", response_model=UserOut, status_code=201)
def register(user: UserCreate):
    db = get_db()
    existing = db.execute("SELECT id FROM users WHERE email=?", (user.email,)).fetchone()
    if existing:
        db.close(); raise HTTPException(400, "Email already registered")
    hashed = hash_password(user.password)
    cur = db.execute(
        "INSERT INTO users (name, email, password_hash, role, phone, address) VALUES (?,?,?,?,?,?)",
        (user.name, user.email, hashed, user.role, user.phone, user.address)
    )
    db.commit()
    row = db.execute("SELECT * FROM users WHERE id=?", (cur.lastrowid,)).fetchone()
    db.close()
    return dict(row)

@app.post("/auth/login")
def login(credentials: UserLogin):
    db = get_db()
    row = db.execute("SELECT * FROM users WHERE email=?", (credentials.email,)).fetchone()
    db.close()
    if not row or not verify_password(credentials.password, row["password_hash"]):
        raise HTTPException(401, "Invalid email or password")
    token = create_token({"id": row["id"], "role": row["role"], "name": row["name"], "email": row["email"]})
    return {"access_token": token, "token_type": "bearer", "user": {
        "id": row["id"], "name": row["name"], "email": row["email"], "role": row["role"]
    }}

@app.get("/auth/me", response_model=UserOut)
def me(user=Depends(get_current_user)):
    db = get_db()
    row = db.execute("SELECT * FROM users WHERE id=?", (user["id"],)).fetchone()
    db.close()
    return dict(row)

# PRODUCTS
@app.get("/products", response_model=list[ProductOut])
def list_products(category: Optional[str]=None, search: Optional[str]=None, shop_id: Optional[int]=None):
    db = get_db()
    q = "SELECT * FROM products WHERE 1=1"
    params = []
    if category: q += " AND category=?"; params.append(category)
    if search: q += " AND name LIKE ?"; params.append(f"%{search}%")
    if shop_id: q += " AND shop_id=?"; params.append(shop_id)
    q += " ORDER BY category, name"
    rows = db.execute(q, params).fetchall()
    db.close()
    return [dict(r) for r in rows]

@app.get("/products/{product_id}", response_model=ProductOut)
def get_product(product_id: int):
    db = get_db()
    row = db.execute("SELECT * FROM products WHERE id=?", (product_id,)).fetchone()
    db.close()
    if not row: raise HTTPException(404, "Product not found")
    return dict(row)

@app.post("/products", response_model=ProductOut, status_code=201)
def create_product(product: ProductCreate, user=Depends(require_shopkeeper)):
    db = get_db()
    cur = db.execute(
        "INSERT INTO products (shop_id,name,description,category,price,unit,stock,image_url,harvest_date,freshness_days) VALUES (?,?,?,?,?,?,?,?,?,?)",
        (user["id"], product.name, product.description, product.category,
         product.price, product.unit, product.stock, product.image_url,
         product.harvest_date, product.freshness_days)
    )
    db.commit()
    row = db.execute("SELECT * FROM products WHERE id=?", (cur.lastrowid,)).fetchone()
    db.close()
    return dict(row)

@app.put("/products/{product_id}", response_model=ProductOut)
def update_product(product_id: int, product: ProductUpdate, user=Depends(require_shopkeeper)):
    db = get_db()
    existing = db.execute("SELECT * FROM products WHERE id=? AND shop_id=?", (product_id, user["id"])).fetchone()
    if not existing: db.close(); raise HTTPException(404, "Product not found")
    updates = {k: v for k, v in product.dict().items() if v is not None}
    set_clause = ", ".join(f"{k}=?" for k in updates)
    db.execute(f"UPDATE products SET {set_clause} WHERE id=?", [*updates.values(), product_id])
    db.commit()
    row = db.execute("SELECT * FROM products WHERE id=?", (product_id,)).fetchone()
    db.close()
    return dict(row)

@app.delete("/products/{product_id}", status_code=204)
def delete_product(product_id: int, user=Depends(require_shopkeeper)):
    db = get_db()
    db.execute("DELETE FROM products WHERE id=? AND shop_id=?", (product_id, user["id"]))
    db.commit(); db.close()

@app.get("/categories")
def get_categories():
    return [
        {"id": "rice_grains", "label": "Rice & Grains", "icon": "🌾"},
        {"id": "dals_pulses", "label": "Dals & Pulses", "icon": "🫘"},
        {"id": "snacks", "label": "Snacks", "icon": "🍿"},
        {"id": "water_drinks", "label": "Water & Drinks", "icon": "💧"},
        {"id": "juice_beverages", "label": "Juice & Beverages", "icon": "🧃"},
        {"id": "fresh_vegetables", "label": "Fresh Vegetables", "icon": "🥦"},
        {"id": "fresh_fruits", "label": "Fresh Fruits", "icon": "🍎"},
        {"id": "dairy_eggs", "label": "Dairy & Eggs", "icon": "🥛"},
        {"id": "spices_masala", "label": "Spices & Masala", "icon": "🌶️"},
        {"id": "oil_ghee", "label": "Oil & Ghee", "icon": "🫙"},
        {"id": "flour_atta", "label": "Flour & Atta", "icon": "🌿"},
        {"id": "household", "label": "Household", "icon": "🧹"},
    ]

# ORDERS
@app.post("/orders", response_model=OrderOut, status_code=201)
def place_order(order: OrderCreate, user=Depends(require_customer)):
    db = get_db()
    rounded = round((order.total_amount + 9) / 10) * 10
    savings = max(0, rounded - order.total_amount)
    wallet = db.execute("SELECT * FROM wallets WHERE user_id=?", (user["id"],)).fetchone()
    if not wallet:
        db.execute("INSERT INTO wallets (user_id, balance, total_saved) VALUES (?,0,0)", (user["id"],))
    if savings > 0:
        db.execute("UPDATE wallets SET balance=balance+?, total_saved=total_saved+? WHERE user_id=?",
                   (savings, savings, user["id"]))
    cur = db.execute(
        "INSERT INTO orders (customer_id,shop_id,items,total_amount,delivery_type,delivery_address,status,carbon_saved) VALUES (?,?,?,?,?,?,?,?)",
        (user["id"], order.shop_id, json.dumps([i.dict() for i in order.items]),
         order.total_amount, order.delivery_type, order.delivery_address, "pending",
         round(len(order.items) * 0.3, 2))
    )
    db.commit()
    row = db.execute("SELECT * FROM orders WHERE id=?", (cur.lastrowid,)).fetchone()
    db.close()
    result = dict(row); result["items"] = json.loads(result["items"])
    return result

@app.get("/orders/my", response_model=list[OrderOut])
def my_orders(user=Depends(get_current_user)):
    db = get_db()
    if user["role"] == "customer":
        rows = db.execute("SELECT * FROM orders WHERE customer_id=? ORDER BY created_at DESC", (user["id"],)).fetchall()
    else:
        rows = db.execute("SELECT * FROM orders WHERE shop_id=? ORDER BY created_at DESC", (user["id"],)).fetchall()
    db.close()
    result = []
    for row in rows:
        r = dict(row); r["items"] = json.loads(r["items"]); result.append(r)
    return result

@app.put("/orders/{order_id}/status")
def update_order_status(order_id: int, update: OrderStatusUpdate, user=Depends(require_shopkeeper)):
    db = get_db()
    db.execute("UPDATE orders SET status=? WHERE id=? AND shop_id=?", (update.status, order_id, user["id"]))
    db.commit(); db.close()
    return {"message": "Status updated"}

@app.get("/shops")
def list_shops():
    db = get_db()
    rows = db.execute("SELECT id,name,email,phone,address FROM users WHERE role='shopkeeper'").fetchall()
    db.close()
    return [dict(r) for r in rows]

# ANALYTICS
@app.get("/analytics/shop")
def shop_analytics(user=Depends(require_shopkeeper)):
    db = get_db()
    total_orders = db.execute("SELECT COUNT(*) FROM orders WHERE shop_id=?", (user["id"],)).fetchone()[0]
    total_revenue = db.execute("SELECT COALESCE(SUM(total_amount),0) FROM orders WHERE shop_id=? AND status='delivered'", (user["id"],)).fetchone()[0]
    pending = db.execute("SELECT COUNT(*) FROM orders WHERE shop_id=? AND status='pending'", (user["id"],)).fetchone()[0]
    top_items_raw = db.execute("SELECT items FROM orders WHERE shop_id=?", (user["id"],)).fetchall()
    item_counts = {}
    for row in top_items_raw:
        for item in json.loads(row["items"]):
            name = item.get("product_name","")
            item_counts[name] = item_counts.get(name, 0) + item.get("quantity", 1)
    top_items = sorted(item_counts.items(), key=lambda x: x[1], reverse=True)[:5]
    daily = db.execute("""
        SELECT DATE(created_at) as day, COUNT(*) as count, COALESCE(SUM(total_amount),0) as revenue
        FROM orders WHERE shop_id=? GROUP BY DATE(created_at) ORDER BY day DESC LIMIT 7
    """, (user["id"],)).fetchall()
    db.close()
    return {
        "total_orders": total_orders,
        "total_revenue": round(total_revenue, 2),
        "pending_orders": pending,
        "top_items": [{"name": k, "count": v} for k, v in top_items],
        "daily": [dict(d) for d in daily]
    }

# AI: SMART CART SUGGESTIONS
@app.post("/ai/suggestions")
def get_smart_suggestions(data: dict):
    cart_items = data.get("cart_items", [])
    cart_names = [i.get("product_name", "").lower() for i in cart_items]
    suggestions_map = {
        "rice": ["Toor Dal", "Turmeric Powder", "Onions", "Tomatoes", "Sunflower Oil"],
        "dal": ["Sona Masoori Rice", "Turmeric Powder", "Onions", "Garam Masala"],
        "atta": ["Sunflower Oil", "Onions", "Tomatoes", "Amul Ghee"],
        "milk": ["Farm Eggs", "Amul Butter", "Nescafé"],
        "tomato": ["Onions", "Garam Masala", "Sunflower Oil", "Turmeric Powder"],
        "snack": ["Kinley Soda", "Bisleri Water", "Real Orange Juice"],
    }
    suggested = set()
    for name in cart_names:
        for key, suggs in suggestions_map.items():
            if key in name:
                for s in suggs:
                    if not any(s.lower()[:4] in cn for cn in cart_names):
                        suggested.add(s)
    if not suggested and cart_items:
        suggested = {"Bisleri Water 1L", "Turmeric Powder", "Sunflower Oil"}
    db = get_db()
    result = []
    for sug in list(suggested)[:4]:
        row = db.execute("SELECT * FROM products WHERE name LIKE ? LIMIT 1", (f"%{sug.split()[0]}%",)).fetchone()
        if row: result.append(dict(row))
    db.close()
    return result

# AI: RECIPE TO CART
@app.post("/ai/recipe-to-cart")
def recipe_to_cart(data: dict):
    recipe = data.get("recipe", "").lower()
    servings = max(1, int(data.get("servings", 4)))
    scale = servings / 4
    recipes = {
        "biryani": [("Basmati Rice", max(1, round(scale)), "kg"), ("Garam Masala", 1, "100g"),
                    ("Onions", max(1, round(0.5*scale)), "kg"), ("Tomatoes", max(1, round(0.3*scale)), "kg"),
                    ("Sunflower Oil", 1, "litre"), ("Turmeric Powder", 1, "250g")],
        "dal": [("Toor Dal", max(1, round(0.25*scale*4)), "kg"), ("Onions", 1, "kg"),
                ("Tomatoes", 1, "kg"), ("Turmeric Powder", 1, "250g"), ("Sunflower Oil", 1, "litre")],
        "roti": [("Aashirvaad Atta 5kg", 1, "pack"), ("Amul Ghee 500ml", 1, "ml")],
        "khichdi": [("Sona Masoori Rice", 1, "kg"), ("Moong Dal", 1, "kg"),
                    ("Turmeric Powder", 1, "250g"), ("Amul Ghee 500ml", 1, "ml")],
        "chole": [("Chana Dal", max(1, round(0.5*scale*2)), "kg"), ("Onions", 1, "kg"),
                  ("Tomatoes", 1, "kg"), ("Garam Masala", 1, "100g"),
                  ("Sunflower Oil", 1, "litre"), ("Turmeric Powder", 1, "250g")],
        "tea": [("Amul Milk 1L", max(1, round(scale)), "litre"), ("Nescafé Classic", 1, "jar")],
        "upma": [("Broken Wheat", 1, "kg"), ("Onions", 1, "kg"), ("Sunflower Oil", 1, "litre")],
        "poha": [("Onions", 1, "kg"), ("Sunflower Oil", 1, "litre"), ("Turmeric Powder", 1, "250g")],
    }
    matched_recipe = None
    recipe_name = recipe
    for key in recipes:
        if key in recipe:
            matched_recipe = recipes[key]; recipe_name = key; break
    if not matched_recipe:
        return {"recipe_name": recipe, "items": [], "message": "Try: biryani, dal, roti, chole, khichdi, upma, tea, poha"}
    db = get_db()
    cart_items = []
    for (name, qty, unit) in matched_recipe:
        row = db.execute("SELECT * FROM products WHERE name LIKE ? LIMIT 1", (f"%{name.split()[0]}%",)).fetchone()
        if row:
            cart_items.append({**dict(row), "suggested_qty": qty})
    db.close()
    return {"recipe_name": recipe_name, "servings": servings, "items": cart_items, "message": f"Ingredients for {recipe_name} (serves {servings})"}

# AI: VOICE TO CART
@app.post("/ai/voice-to-cart")
def voice_to_cart(data: dict):
    text = data.get("text", "").lower()
    hindi_nums = {"ek": 1, "do": 2, "teen": 3, "char": 4, "paanch": 5, "chhe": 6}
    db = get_db()
    all_products = db.execute("SELECT * FROM products").fetchall()
    items_found = []
    words = re.sub(r'[^\w\s]', ' ', text).split()
    for product in all_products:
        pwords = product["name"].lower().split()
        if any(pw in words for pw in pwords if len(pw) > 3):
            qty = 1
            for hw, hv in hindi_nums.items():
                if hw in text: qty = hv; break
            for m in re.finditer(r'\b(\d+)\b', text):
                qty = int(m.group(1)); break
            items_found.append({**dict(product), "suggested_qty": qty})
            if len(items_found) >= 6: break
    db.close()
    return {"parsed_text": text, "items": items_found}

# WEATHER SUGGESTIONS
@app.get("/ai/weather-suggestions")
def weather_suggestions(weather: str = "sunny"):
    weather_map = {
        "rainy": {"message": "It's raining! Rainy day essentials 🌧️",
                  "products": ["Nescafé", "Parle-G", "Bisleri", "Haldiram", "Amul Milk"]},
        "hot": {"message": "Stay cool — refreshing picks ☀️",
                "products": ["Bisleri Water", "Real Orange", "Tropicana", "Kinley"]},
        "cold": {"message": "Warm up with these favourites 🧥",
                 "products": ["Nescafé", "Amul Milk", "Garam Masala", "Amul Ghee", "Aashirvaad"]},
        "sunny": {"message": "Beautiful day! Stock up on fresh items 🌤️",
                  "products": ["Tomatoes", "Spinach", "Bananas", "Apples", "Farm Eggs"]},
    }
    info = weather_map.get(weather, weather_map["sunny"])
    db = get_db()
    result = []
    for name in info["products"]:
        row = db.execute("SELECT * FROM products WHERE name LIKE ? LIMIT 1", (f"%{name}%",)).fetchone()
        if row: result.append(dict(row))
    db.close()
    return {"message": info["message"], "weather": weather, "products": result}

# KHATA
@app.post("/khata", status_code=201)
def add_khata_entry(entry: KhataEntryCreate, user=Depends(require_shopkeeper)):
    db = get_db()
    db.execute("INSERT INTO khata (shop_id,customer_id,amount,note,type) VALUES (?,?,?,?,?)",
               (user["id"], entry.customer_id, entry.amount, entry.note, entry.type))
    db.commit(); db.close()
    return {"message": "Khata entry added"}

@app.get("/khata")
def get_khata(user=Depends(get_current_user)):
    db = get_db()
    if user["role"] == "shopkeeper":
        rows = db.execute("""SELECT k.*, u.name as customer_name, u.phone as customer_phone
            FROM khata k JOIN users u ON k.customer_id=u.id WHERE k.shop_id=? ORDER BY k.created_at DESC""",
            (user["id"],)).fetchall()
    else:
        rows = db.execute("""SELECT k.*, u.name as shop_name FROM khata k
            JOIN users u ON k.shop_id=u.id WHERE k.customer_id=? ORDER BY k.created_at DESC""",
            (user["id"],)).fetchall()
    db.close()
    return [dict(r) for r in rows]

@app.get("/khata/summary")
def khata_summary(user=Depends(require_shopkeeper)):
    db = get_db()
    rows = db.execute("""SELECT k.customer_id, u.name, u.phone,
        SUM(CASE WHEN k.type='credit' THEN k.amount ELSE -k.amount END) as balance
        FROM khata k JOIN users u ON k.customer_id=u.id
        WHERE k.shop_id=? GROUP BY k.customer_id""", (user["id"],)).fetchall()
    db.close()
    return [dict(r) for r in rows]

# RECURRING ORDERS
@app.post("/recurring-orders", status_code=201)
def create_recurring(order: RecurringOrderCreate, user=Depends(require_customer)):
    db = get_db()
    db.execute("INSERT INTO recurring_orders (customer_id,shop_id,items,frequency,delivery_type,delivery_address,active) VALUES (?,?,?,?,?,?,1)",
               (user["id"], order.shop_id, json.dumps([i.dict() for i in order.items]),
                order.frequency, order.delivery_type, order.delivery_address))
    db.commit(); db.close()
    return {"message": "Recurring order set up!"}

@app.get("/recurring-orders")
def list_recurring(user=Depends(get_current_user)):
    db = get_db()
    if user["role"] == "customer":
        rows = db.execute("SELECT * FROM recurring_orders WHERE customer_id=? AND active=1", (user["id"],)).fetchall()
    else:
        rows = db.execute("SELECT * FROM recurring_orders WHERE shop_id=? AND active=1", (user["id"],)).fetchall()
    db.close()
    result = []
    for r in rows:
        d = dict(r); d["items"] = json.loads(d["items"]); result.append(d)
    return result

@app.delete("/recurring-orders/{order_id}", status_code=204)
def cancel_recurring(order_id: int, user=Depends(require_customer)):
    db = get_db()
    db.execute("UPDATE recurring_orders SET active=0 WHERE id=? AND customer_id=?", (order_id, user["id"]))
    db.commit(); db.close()

# GROUP ORDERS
@app.post("/group-orders", status_code=201)
def create_group_order(order: GroupOrderCreate, user=Depends(require_customer)):
    db = get_db()
    code = f"GRP{random.randint(1000,9999)}"
    cur = db.execute("INSERT INTO group_orders (creator_id,shop_id,code,target_amount,current_amount,status) VALUES (?,?,?,?,0,'open')",
                     (user["id"], order.shop_id, code, order.target_amount))
    db.commit()
    db.execute("INSERT INTO group_order_members (group_order_id,user_id,items,contribution) VALUES (?,?,?,?)",
               (cur.lastrowid, user["id"], json.dumps([i.dict() for i in order.items]), order.my_contribution))
    db.execute("UPDATE group_orders SET current_amount=current_amount+? WHERE id=?", (order.my_contribution, cur.lastrowid))
    db.commit(); db.close()
    return {"message": "Group order created", "code": code, "group_order_id": cur.lastrowid}

@app.post("/group-orders/join")
def join_group_order(join: GroupOrderJoin, user=Depends(require_customer)):
    db = get_db()
    go = db.execute("SELECT * FROM group_orders WHERE code=? AND status='open'", (join.code,)).fetchone()
    if not go: db.close(); raise HTTPException(404, "Group order not found")
    db.execute("INSERT INTO group_order_members (group_order_id,user_id,items,contribution) VALUES (?,?,?,?)",
               (go["id"], user["id"], json.dumps([i.dict() for i in join.items]), join.contribution))
    db.execute("UPDATE group_orders SET current_amount=current_amount+? WHERE id=?", (join.contribution, go["id"]))
    updated = db.execute("SELECT * FROM group_orders WHERE id=?", (go["id"],)).fetchone()
    if updated["current_amount"] >= updated["target_amount"]:
        db.execute("UPDATE group_orders SET status='reached' WHERE id=?", (go["id"],))
    db.commit(); db.close()
    return {"message": "Joined!", "current": updated["current_amount"], "target": updated["target_amount"]}

@app.get("/group-orders/{code}")
def get_group_order(code: str):
    db = get_db()
    go = db.execute("SELECT * FROM group_orders WHERE code=?", (code,)).fetchone()
    if not go: db.close(); raise HTTPException(404, "Group order not found")
    members = db.execute("""SELECT m.*, u.name FROM group_order_members m
        JOIN users u ON m.user_id=u.id WHERE m.group_order_id=?""", (go["id"],)).fetchall()
    db.close()
    return {**dict(go), "members": [dict(m) for m in members]}

# RESTOCK ALERTS
@app.post("/restock-alerts", status_code=201)
def create_restock_alert(alert: RestockAlertCreate, user=Depends(require_customer)):
    db = get_db()
    existing = db.execute("SELECT id FROM restock_alerts WHERE user_id=? AND product_id=?",
                          (user["id"], alert.product_id)).fetchone()
    if existing: db.close(); return {"message": "Alert already set"}
    db.execute("INSERT INTO restock_alerts (user_id,product_id) VALUES (?,?)", (user["id"], alert.product_id))
    db.commit(); db.close()
    return {"message": "You'll be notified when restocked!"}

@app.get("/restock-alerts")
def get_my_alerts(user=Depends(require_customer)):
    db = get_db()
    rows = db.execute("""SELECT ra.*, p.name as product_name, p.stock FROM restock_alerts ra
        JOIN products p ON ra.product_id=p.id WHERE ra.user_id=?""", (user["id"],)).fetchall()
    db.close()
    return [dict(r) for r in rows]

# BUNDLES
@app.get("/bundles")
def list_bundles(shop_id: Optional[int]=None):
    db = get_db()
    q = "SELECT * FROM bundles WHERE 1=1"
    params = []
    if shop_id: q += " AND shop_id=?"; params.append(shop_id)
    rows = db.execute(q, params).fetchall()
    db.close()
    result = []
    for r in rows:
        d = dict(r); d["items"] = json.loads(d["items"]); result.append(d)
    return result

@app.post("/bundles", status_code=201)
def create_bundle(bundle: BundleCreate, user=Depends(require_shopkeeper)):
    db = get_db()
    db.execute("INSERT INTO bundles (shop_id,name,description,items,original_price,bundle_price,image_url) VALUES (?,?,?,?,?,?,?)",
               (user["id"], bundle.name, bundle.description, json.dumps([i.dict() for i in bundle.items]),
                bundle.original_price, bundle.bundle_price, bundle.image_url))
    db.commit(); db.close()
    return {"message": "Bundle created!"}

# WALLET
@app.get("/wallet")
def get_wallet(user=Depends(require_customer)):
    db = get_db()
    wallet = db.execute("SELECT * FROM wallets WHERE user_id=?", (user["id"],)).fetchone()
    db.close()
    if not wallet: return {"balance": 0.0, "total_saved": 0.0, "coupon_available": False, "coupon_value": 0}
    balance = wallet["balance"]
    return {"balance": round(balance, 2), "total_saved": round(wallet["total_saved"], 2),
            "coupon_available": balance >= 100, "coupon_value": int(balance // 100) * 10}

# LEADERBOARD
@app.get("/leaderboard")
def leaderboard(shop_id: Optional[int]=None):
    db = get_db()
    q = """SELECT o.customer_id, u.name, COUNT(o.id) as order_count,
        COALESCE(SUM(o.total_amount),0) as total_spent
        FROM orders o JOIN users u ON o.customer_id=u.id
        WHERE o.status='delivered'"""
    params = []
    if shop_id: q += " AND o.shop_id=?"; params.append(shop_id)
    q += " GROUP BY o.customer_id ORDER BY total_spent DESC LIMIT 10"
    rows = db.execute(q, params).fetchall()
    db.close()
    return [{"rank": i+1, **dict(r)} for i, r in enumerate(rows)]

# CARBON FOOTPRINT
@app.get("/carbon/stats")
def carbon_stats(user=Depends(require_customer)):
    db = get_db()
    total = db.execute("SELECT COALESCE(SUM(carbon_saved),0) FROM orders WHERE customer_id=?",
                       (user["id"],)).fetchone()[0]
    order_count = db.execute("SELECT COUNT(*) FROM orders WHERE customer_id=?", (user["id"],)).fetchone()[0]
    db.close()
    return {"total_kg_saved": round(total, 2), "orders": order_count,
            "trees_equivalent": round(total / 21, 3),
            "km_equivalent": round(total * 4, 1)}

# WHATSAPP BOT (simulate parsing)
@app.post("/whatsapp/parse-order")
def whatsapp_parse(data: WhatsAppOrderCreate):
    text = data.message.lower()
    db = get_db()
    all_products = db.execute("SELECT * FROM products").fetchall()
    items_found = []
    for product in all_products:
        pwords = product["name"].lower().split()
        words = text.split()
        if any(pw in words for pw in pwords if len(pw) > 3):
            qty_match = re.search(r'(\d+)\s*(?:kg|litre|packet|bottle|dozen|pack)?', text)
            qty = int(qty_match.group(1)) if qty_match else 1
            items_found.append({"product": dict(product), "quantity": qty})
            if len(items_found) >= 8: break
    db.close()
    if not items_found:
        return {"success": False, "reply": "Sorry, could not find those items. Please try: '2 kg rice, 1 litre milk'"}
    reply_lines = ["OllUR Order Summary:"]
    total = 0
    for item in items_found:
        line = f"- {item['product']['name']} x{item['quantity']} = ₹{item['product']['price'] * item['quantity']:.0f}"
        reply_lines.append(line)
        total += item['product']['price'] * item['quantity']
    reply_lines.append(f"Total: ₹{total:.0f}")
    reply_lines.append("Reply YES to confirm or NO to cancel.")
    return {"success": True, "items": items_found, "reply": "\n".join(reply_lines), "total": round(total, 2)}

# STORE MAP (static aisle data)
@app.get("/store-map/{shop_id}")
def store_map(shop_id: int):
    return {
        "shop_id": shop_id,
        "aisles": [
            {"id": 1, "label": "Aisle 1", "x": 10, "y": 10, "w": 120, "h": 60, "categories": ["rice_grains", "flour_atta"]},
            {"id": 2, "label": "Aisle 2", "x": 10, "y": 90, "w": 120, "h": 60, "categories": ["dals_pulses"]},
            {"id": 3, "label": "Aisle 3", "x": 150, "y": 10, "w": 120, "h": 60, "categories": ["spices_masala", "oil_ghee"]},
            {"id": 4, "label": "Aisle 4", "x": 150, "y": 90, "w": 120, "h": 60, "categories": ["snacks"]},
            {"id": 5, "label": "Fridge", "x": 290, "y": 10, "w": 120, "h": 60, "categories": ["dairy_eggs", "fresh_vegetables"]},
            {"id": 6, "label": "Fresh Corner", "x": 290, "y": 90, "w": 120, "h": 60, "categories": ["fresh_fruits"]},
            {"id": 7, "label": "Beverages", "x": 430, "y": 10, "w": 120, "h": 140, "categories": ["water_drinks", "juice_beverages"]},
            {"id": 8, "label": "Household", "x": 10, "y": 170, "w": 540, "h": 40, "categories": ["household"]},
        ]
    }
