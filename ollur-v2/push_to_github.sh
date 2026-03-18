#!/bin/bash

# ─────────────────────────────────────────────────────────────
#  OllUR → GitHub Push Script (Linux)
#  
#  BEFORE RUNNING:
#  1. Download the ollur-v2 folder to your computer
#  2. Open terminal in that folder
#  3. Run: bash push_to_github.sh
# ─────────────────────────────────────────────────────────────

set -e

echo ""
echo "╔══════════════════════════════════════╗"
echo "║   🛒  OllUR → GitHub Push Script     ║"
echo "╚══════════════════════════════════════╝"
echo ""

# ── Step 1: Check git is installed ──────────────────────────
if ! command -v git &>/dev/null; then
  echo "❌  git not installed. Run:"
  echo "    sudo apt install git"
  exit 1
fi
echo "✅  git $(git --version | awk '{print $3}')"

# ── Step 2: Confirm correct folder ──────────────────────────
if [ ! -f "backend/main.py" ]; then
  echo "❌  Wrong folder. Navigate into ollur-v2 first:"
  echo "    cd ~/Downloads/ollur-v2"
  echo "    bash push_to_github.sh"
  exit 1
fi
echo "✅  Inside ollur-v2 folder"

# ── Step 3: Get GitHub token ─────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  You need a GitHub Personal Access Token"
echo ""
echo "  1. Open: https://github.com/settings/tokens"
echo "  2. Click 'Generate new token (classic)'"
echo "  3. Tick the ✅ repo checkbox"
echo "  4. Click Generate token"
echo "  5. Copy the token (starts with ghp_...)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
read -rsp "Paste your GitHub token (hidden): " TOKEN
echo ""

if [ -z "$TOKEN" ]; then
  echo "❌  No token entered. Exiting."
  exit 1
fi
echo "✅  Token received"

# ── Step 4: Setup git ────────────────────────────────────────
if [ ! -d ".git" ]; then
  git init
fi
git config user.email "mohanvajram@github.com"
git config user.name "mohanvajram"

# ── Step 5: Stage and commit all files ───────────────────────
git add .
echo "✅  All files staged (47 files)"

git diff --cached --quiet && echo "ℹ️   Nothing new to commit" || \
git commit -m "🛒 OllUR v2 — Full-stack local grocery app

Tech: Python FastAPI + React.js + SQLite
47 files | 4,321 lines of code

Features:
✅ Shopkeeper & Customer dual login
✅ 12 grocery categories, 35+ products
✅ AI smart cart suggestions
✅ Recipe-to-Cart (biryani, dal, chole...)
✅ Voice ordering in English & Hindi
✅ Weather-aware suggestions
✅ SVG store map with aisle layout
✅ Freshness guarantee badges
✅ Restock alerts
✅ Festival bundle deals
✅ Micro-savings jar & coupon
✅ Carbon footprint tracker
✅ Neighbourhood leaderboard
✅ Recurring scheduled orders
✅ Digital Khata (credit book)
✅ Group / Mohalla orders
✅ WhatsApp order bot simulator
✅ Shopkeeper analytics dashboard"

# ── Step 6: Set branch and remote ────────────────────────────
git branch -M main
git remote remove origin 2>/dev/null || true
git remote add origin "https://${TOKEN}@github.com/mohanvajram/OllUR.git"
echo "✅  Remote set to github.com/mohanvajram/OllUR"

# ── Step 7: Push ─────────────────────────────────────────────
echo ""
echo "🚀  Pushing to GitHub..."
echo ""

if git push -u origin main --force; then
  echo ""
  echo "╔══════════════════════════════════════════════════════╗"
  echo "║  🎉  SUCCESS! OllUR is live on GitHub!               ║"
  echo "║                                                      ║"
  echo "║  👉  https://github.com/mohanvajram/OllUR            ║"
  echo "╚══════════════════════════════════════════════════════╝"
  echo ""
else
  echo ""
  echo "╔══════════════════════════════════════╗"
  echo "║  ❌  Push failed. Try these fixes:   ║"
  echo "╚══════════════════════════════════════╝"
  echo ""
  echo "  1. Make sure token has 'repo' scope"
  echo "  2. Make sure the repo exists:"
  echo "     https://github.com/mohanvajram/OllUR"
  echo "  3. Re-run this script with a fresh token"
  echo ""
  exit 1
fi
