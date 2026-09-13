#!/bin/bash
# Boxing Coach - Quick deploy to GitHub
# Usage: ./deploy.sh <your-github-token>

TOKEN="$1"
REPO="boxing-coach"

if [ -z "$TOKEN" ]; then
    echo "❌ Token required"
    echo "Usage: ./deploy.sh ghp_xxxxxxxxxxxx"
    exit 1
fi

cd /root/.nanobot/workspace/boxing-coach

# Login to GitHub
echo "$TOKEN" | gh auth login --with-token

# Create repo
gh repo create "$REPO" --private --public --description "AI Boxing Coach - Web app powered by OpenAI GPT" --source=. --push

echo "✅ Deployed to: https://github.com/[your-username]/$REPO"
