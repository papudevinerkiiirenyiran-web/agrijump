#!/bin/bash
# AgriJump — push to GitHub in one shot
# Usage: bash deploy.sh
# Prereqs: git installed (xcode-select --install) and an empty repo created on github.com

set -e
cd "$(dirname "$0")"

echo "🥏 AgriJump · push to GitHub"
echo "──────────────────────────────"

# 0. Check git
if ! git --version >/dev/null 2>&1; then
  echo "❌ git not found. Run this first: xcode-select --install"
  exit 1
fi

# 1. Initialise once
if [ ! -d .git ]; then
  git init
  echo "✓ Local repo initialised"
else
  echo "· Local repo already exists, skipping git init"
fi

git branch -M main 2>/dev/null || true

# 2. Commit
git add .
if git diff --cached --quiet 2>/dev/null; then
  echo "· Nothing new to commit"
else
  git commit -m "feat: AgriJump v0.1 — Discovery Map + Drop Zone + PWA"
  echo "✓ Committed"
fi

# 3. Wire up the remote
if git remote get-url origin >/dev/null 2>&1; then
  echo "· Remote already set: $(git remote get-url origin)"
else
  echo ""
  echo "First create an empty repo at https://github.com/new"
  echo "(do NOT tick README or .gitignore), then paste its URL below."
  echo "Example: https://github.com/yourname/agrijump.git"
  printf "Repo URL > "
  read -r REPO_URL
  if [ -z "$REPO_URL" ]; then
    echo "❌ No URL entered, aborting."
    exit 1
  fi
  git remote add origin "$REPO_URL"
  echo "✓ Linked to $REPO_URL"
fi

# 4. Push
echo ""
echo "Pushing to main…"
git push -u origin main

echo ""
echo "✅ Pushed!"
echo "Next: open https://vercel.com → New Project → import this repo → Deploy"
