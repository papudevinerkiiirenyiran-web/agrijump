#!/bin/bash
# ============================================================
# AgriJump — Quick Start Script for Beginners
# ============================================================
# This file lives in your project folder.
# Open Terminal, paste the commands below one block at a time.
#
# PROJECT FOLDER:
#   /Users/kirensmmm/WorkBuddy AI/2026-09-26-23-07-14/agrijump
#
# ALL iOS FIXES AND PAGES ARE ALREADY BUILT.
# You only need to start the server.
# ============================================================

# -----------------------------------------------------------
# 0. FIRST TIME ONLY — make `npm` work in Terminal
# -----------------------------------------------------------
# Node.js is bundled with WorkBuddy and has been added to your
# ~/.zshrc automatically. If `npm` is still not found, run:
#
#   source ~/.zshrc
#
# ...or simply close Terminal and open a new window.
#
# Verify it works:
#   node -v     ->  v22.22.2
#   npm  -v     ->  10.9.7

# -----------------------------------------------------------
# 1. GO TO THE PROJECT FOLDER
# -----------------------------------------------------------
cd "/Users/kirensmmm/WorkBuddy AI/2026-09-26-23-07-14/agrijump"

# -----------------------------------------------------------
# 2. START THE DEV SERVER
# -----------------------------------------------------------
npm run dev

# -----------------------------------------------------------
# 3. OPEN IN BROWSER
# -----------------------------------------------------------
# Computer:  http://localhost:3000
# iPhone:    http://10.3.6.81:3000      (same Wi-Fi required)
#
# Tip: your Mac's IP can change. Check it with:
#   System Settings -> Wi-Fi -> Details -> IP Address
# or type:  ipconfig getifaddr en0

# -----------------------------------------------------------
# 4. ADD TO HOME SCREEN (PWA, full-screen, no address bar)
# -----------------------------------------------------------
# In Safari on iPhone:
#   Share button -> "Add to Home Screen" -> Add

# -----------------------------------------------------------
# 5. STOP THE SERVER
# -----------------------------------------------------------
# Press Ctrl + C in Terminal.
# If port 3000 is already in use, kill it with:
#   lsof -ti :3000 | xargs kill -9

# -----------------------------------------------------------
# 6. DEPLOY TO VERCEL (publish online)
# -----------------------------------------------------------
# First time only — install Vercel CLI:
#   npm i -g vercel
#
# Then deploy:
#   cd "/Users/kirensmmm/WorkBuddy AI/2026-09-26-23-07-14/agrijump"
#   vercel --prod
#
# It will ask you to log in with GitHub. Follow the prompts.
