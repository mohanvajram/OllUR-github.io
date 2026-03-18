# 📁 How to Push OllUR to GitHub

## Step 1 — Create a GitHub repo

1. Go to https://github.com/new
2. Set name: `ollur`
3. Leave it **Public** (or Private)
4. Do NOT check "Add a README" (we already have one)
5. Click **Create repository**

---

## Step 2 — Push your code

Open a terminal inside the `ollur/` folder and run:

```bash
git init
git add .
git commit -m "🛒 Initial commit: OllUR local grocery app"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/ollur.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

---

## Step 3 — Verify

Visit `https://github.com/YOUR_USERNAME/ollur` — you should see all your files with the README displayed.

---

## Running locally after cloning

```bash
git clone https://github.com/YOUR_USERNAME/ollur.git
cd ollur

# Terminal 1 — backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload

# Terminal 2 — frontend
cd frontend
npm install && npm run dev
```
