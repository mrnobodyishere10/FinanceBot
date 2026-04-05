#!/bin/bash
# git_push.sh
# Script otomatis commit & push FinanceBot ke GitHub

# ===============================
# CONFIGURATION
# ===============================
BRANCH_NAME="main"
COMMIT_MESSAGE="Auto commit: $(date +'%Y-%m-%d %H:%M:%S')"

# ===============================
# CHECK GIT REPO
# ===============================
if [ ! -d ".git" ]; then
  echo "Git repository not found. Initialize first with 'git init'"
  exit 1
fi

# ===============================
# ADD CHANGES
# ===============================
git add .

# ===============================
# COMMIT CHANGES
# ===============================
git commit -m "$COMMIT_MESSAGE"

# ===============================
# PUSH TO GITHUB
# ===============================
echo "Pushing changes to GitHub branch $BRANCH_NAME..."
git push origin $BRANCH_NAME

if [ $? -eq 0 ]; then
  echo "✅ Push successful!"
else
  echo "❌ Push failed. Check remote URL or authentication."
fi
