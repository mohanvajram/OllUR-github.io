import sqlite3
DB_PATH = "ollur.db"

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    db = get_db()
    db.execute("""CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('shopkeeper','customer')),
        phone TEXT, address TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)""")
    db.execute("""CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT, shop_id INTEGER NOT NULL REFERENCES users(id),
        name TEXT NOT NULL, description TEXT, category TEXT NOT NULL,
        price REAL NOT NULL, unit TEXT NOT NULL DEFAULT 'kg', stock INTEGER DEFAULT 100,
        image_url TEXT, harvest_date TEXT, freshness_days INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)""")
    db.execute("""CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER NOT NULL REFERENCES users(id),
        shop_id INTEGER NOT NULL REFERENCES users(id),
        items TEXT NOT NULL, total_amount REAL NOT NULL,
        delivery_type TEXT NOT NULL, delivery_address TEXT,
        status TEXT DEFAULT 'pending', carbon_saved REAL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)""")
    db.execute("""CREATE TABLE IF NOT EXISTS khata (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        shop_id INTEGER NOT NULL REFERENCES users(id),
        customer_id INTEGER NOT NULL REFERENCES users(id),
        amount REAL NOT NULL, note TEXT, type TEXT NOT NULL DEFAULT 'credit',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)""")
    db.execute("""CREATE TABLE IF NOT EXISTS recurring_orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER NOT NULL REFERENCES users(id),
        shop_id INTEGER NOT NULL REFERENCES users(id),
        items TEXT NOT NULL, frequency TEXT NOT NULL,
        delivery_type TEXT NOT NULL, delivery_address TEXT,
        active INTEGER DEFAULT 1, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)""")
    db.execute("""CREATE TABLE IF NOT EXISTS group_orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        creator_id INTEGER NOT NULL REFERENCES users(id),
        shop_id INTEGER NOT NULL REFERENCES users(id),
        code TEXT UNIQUE NOT NULL, target_amount REAL NOT NULL,
        current_amount REAL DEFAULT 0, status TEXT DEFAULT 'open',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)""")
    db.execute("""CREATE TABLE IF NOT EXISTS group_order_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        group_order_id INTEGER NOT NULL REFERENCES group_orders(id),
        user_id INTEGER NOT NULL REFERENCES users(id),
        items TEXT NOT NULL, contribution REAL NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)""")
    db.execute("""CREATE TABLE IF NOT EXISTS restock_alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id),
        product_id INTEGER NOT NULL REFERENCES products(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)""")
    db.execute("""CREATE TABLE IF NOT EXISTS bundles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        shop_id INTEGER NOT NULL REFERENCES users(id),
        name TEXT NOT NULL, description TEXT, items TEXT NOT NULL,
        original_price REAL NOT NULL, bundle_price REAL NOT NULL,
        image_url TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)""")
    db.execute("""CREATE TABLE IF NOT EXISTS wallets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE NOT NULL REFERENCES users(id),
        balance REAL DEFAULT 0, total_saved REAL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)""")
    db.commit()

    from auth import hash_password
    count = db.execute("SELECT COUNT(*) FROM users").fetchone()[0]
    if count == 0:
        cur = db.execute("INSERT INTO users (name,email,password_hash,role,phone,address) VALUES (?,?,?,?,?,?)",
            ("Ravi's Kirana Store","shop@ollur.com",hash_password("shop123"),"shopkeeper","9876543210","12 Gandhi Nagar, Hyderabad"))
        shop_id = cur.lastrowid
        cust = db.execute("INSERT INTO users (name,email,password_hash,role,phone,address) VALUES (?,?,?,?,?,?)",
            ("Priya Sharma","customer@ollur.com",hash_password("cust123"),"customer","9123456789","45 MG Road, Hyderabad"))
        cust_id = cust.lastrowid
        db.commit()

        import datetime
        today = datetime.date.today().isoformat()
        products = [
            (shop_id,"Sona Masoori Rice","Premium quality raw rice","rice_grains",58.0,"kg",500,"https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300",None,None),
            (shop_id,"Basmati Rice","Long grain fragrant basmati","rice_grains",90.0,"kg",300,"https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300",None,None),
            (shop_id,"Broken Wheat (Daliya)","Whole wheat cracked grains","rice_grains",42.0,"kg",200,"https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=300",None,None),
            (shop_id,"Toor Dal","Split pigeon peas","dals_pulses",120.0,"kg",400,"https://images.unsplash.com/photo-1585996844232-d1ab93ef3b18?w=300",None,None),
            (shop_id,"Moong Dal","Split green lentils","dals_pulses",110.0,"kg",350,"https://images.unsplash.com/photo-1585996844232-d1ab93ef3b18?w=300",None,None),
            (shop_id,"Chana Dal","Split chickpeas","dals_pulses",95.0,"kg",300,"https://images.unsplash.com/photo-1585996844232-d1ab93ef3b18?w=300",None,None),
            (shop_id,"Urad Dal","Split black lentils","dals_pulses",130.0,"kg",250,"https://images.unsplash.com/photo-1585996844232-d1ab93ef3b18?w=300",None,None),
            (shop_id,"Haldiram Bhujia","Classic salty snack","snacks",35.0,"pack",200,"https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=300",None,None),
            (shop_id,"Parle-G Biscuits","Iconic glucose biscuits","snacks",10.0,"pack",500,"https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=300",None,None),
            (shop_id,"Lay's Chips","Crispy potato chips","snacks",20.0,"pack",300,"https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=300",None,None),
            (shop_id,"Bisleri Water 1L","Packaged drinking water","water_drinks",20.0,"bottle",1000,"https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=300",None,None),
            (shop_id,"Bisleri Water 5L","Large packaged water","water_drinks",70.0,"bottle",300,"https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=300",None,None),
            (shop_id,"Kinley Soda","Refreshing soda water","water_drinks",30.0,"bottle",200,"https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=300",None,None),
            (shop_id,"Real Orange Juice","100% fruit juice, 1L","juice_beverages",85.0,"litre",150,"https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=300",None,None),
            (shop_id,"Tropicana Apple","Fresh pressed apple juice","juice_beverages",90.0,"litre",120,"https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=300",None,None),
            (shop_id,"Nescafé Classic","Instant coffee powder","juice_beverages",220.0,"jar",80,"https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=300",None,None),
            (shop_id,"Tomatoes","Fresh farm tomatoes","fresh_vegetables",30.0,"kg",50,"https://images.unsplash.com/photo-1546094096-0df4bcabd337?w=300",today,3),
            (shop_id,"Onions","Red onions","fresh_vegetables",25.0,"kg",80,"https://images.unsplash.com/photo-1518977956812-cd3dbadaaf31?w=300",today,7),
            (shop_id,"Potatoes","Fresh potatoes","fresh_vegetables",28.0,"kg",100,"https://images.unsplash.com/photo-1518977956812-cd3dbadaaf31?w=300",today,10),
            (shop_id,"Spinach","Fresh leafy spinach","fresh_vegetables",20.0,"bunch",40,"https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=300",today,2),
            (shop_id,"Bananas","Fresh yellow bananas","fresh_fruits",40.0,"dozen",60,"https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=300",today,4),
            (shop_id,"Apples","Shimla apples","fresh_fruits",140.0,"kg",50,"https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=300",today,7),
            (shop_id,"Mangoes","Alphonso mangoes","fresh_fruits",200.0,"dozen",30,"https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=300",today,3),
            (shop_id,"Amul Milk 1L","Full cream pasteurised milk","dairy_eggs",68.0,"litre",100,"https://images.unsplash.com/photo-1563636619-e9143da7973b?w=300",today,2),
            (shop_id,"Farm Eggs","Free range eggs (12 pcs)","dairy_eggs",85.0,"dozen",80,"https://images.unsplash.com/photo-1518569656558-1f25e69d2221?w=300",today,5),
            (shop_id,"Amul Butter 500g","Salted butter","dairy_eggs",240.0,"pack",60,"https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300",None,None),
            (shop_id,"Turmeric Powder","Pure haldi powder","spices_masala",55.0,"250g",200,"https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=300",None,None),
            (shop_id,"Red Chilli Powder","Hot chilli powder","spices_masala",60.0,"250g",150,"https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=300",None,None),
            (shop_id,"Garam Masala","Aromatic spice blend","spices_masala",80.0,"100g",100,"https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=300",None,None),
            (shop_id,"Sunflower Oil 1L","Refined sunflower oil","oil_ghee",130.0,"litre",150,"https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=300",None,None),
            (shop_id,"Amul Ghee 500ml","Pure cow ghee","oil_ghee",310.0,"ml",80,"https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=300",None,None),
            (shop_id,"Aashirvaad Atta 5kg","Whole wheat flour","flour_atta",225.0,"pack",100,"https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=300",None,None),
            (shop_id,"Besan 1kg","Chickpea gram flour","flour_atta",85.0,"kg",80,"https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=300",None,None),
            (shop_id,"Surf Excel 1kg","Laundry detergent powder","household",195.0,"kg",100,"https://images.unsplash.com/photo-1583947581924-860bda6a26df?w=300",None,None),
            (shop_id,"Vim Dishwash Bar","Dishwashing soap bar","household",35.0,"bar",200,"https://images.unsplash.com/photo-1583947581924-860bda6a26df?w=300",None,None),
        ]
        db.executemany("INSERT INTO products (shop_id,name,description,category,price,unit,stock,image_url,harvest_date,freshness_days) VALUES (?,?,?,?,?,?,?,?,?,?)", products)

        # Seed a festival bundle
        import json as _json
        db.execute("INSERT INTO bundles (shop_id,name,description,items,original_price,bundle_price,image_url) VALUES (?,?,?,?,?,?,?)",
            (shop_id, "Diwali Snack Pack", "Celebrate with the best snacks!",
             _json.dumps([{"product_id":8,"product_name":"Haldiram Bhujia","quantity":2,"price":35},
                          {"product_id":9,"product_name":"Parle-G Biscuits","quantity":3,"price":10},
                          {"product_id":10,"product_name":"Lay's Chips","quantity":2,"price":20}]),
             160.0, 129.0, "https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=300"))

        # Seed khata entry
        db.execute("INSERT INTO khata (shop_id,customer_id,amount,note,type) VALUES (?,?,?,?,?)",
                   (shop_id, cust_id, 250.0, "Monthly grocery credit", "credit"))

        db.commit()
    db.close()
