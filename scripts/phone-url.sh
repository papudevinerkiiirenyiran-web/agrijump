#!/bin/bash
# ============================================================
# Print the URL to open AgriJump on your phone.
#
# The Mac's LAN address changes whenever the network changes
# (home Wi-Fi -> campus Wi-Fi -> iPhone hotspot), so run this
# whenever the old address stops working.
#
#   bash scripts/phone-url.sh
# ============================================================

PORT="${1:-3000}"

IP=$(ipconfig getifaddr en0 2>/dev/null)
if [ -z "$IP" ]; then IP=$(ipconfig getifaddr en1 2>/dev/null); fi
if [ -z "$IP" ]; then
  IP=$(ifconfig | grep -E "inet [0-9]" | grep -v 127.0.0.1 | awk '{print $2}' | head -n 1)
fi

# Is the server actually up?
CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "http://localhost:$PORT/" 2>/dev/null)

echo ""
echo "  AgriJump — phone access"
echo "  ------------------------------------"
if [ "$CODE" = "200" ]; then
  echo "  Server:  running on port $PORT"
else
  echo "  Server:  NOT running on port $PORT"
  echo "           start it with:  npm run dev"
fi
echo "  Computer: http://localhost:$PORT"
if [ -n "$IP" ]; then
  echo "  Phone:    http://$IP:$PORT"
  echo ""
  echo "  Your phone must be on the same network as this Mac."
else
  echo "  Phone:    (no network address found — are you offline?)"
fi
echo ""
