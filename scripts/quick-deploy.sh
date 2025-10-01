#!/bin/bash

# =============================================================================
# WATSONX INNOVATION HUB - QUICK DEPLOYMENT SCRIPT
# =============================================================================
# This script provides a quick way to deploy the repository to GitHub
# with minimal configuration for rapid prototyping and development
# =============================================================================

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${1}${2}${NC}"
}

print_status $BLUE "🚀 Quick Deploy to GitHub"
print_status $BLUE "========================="

# Check if git is initialized
if [ ! -d ".git" ]; then
    print_status $YELLOW "Initializing Git repository..."
    git init
    git branch -M main
fi

# Get GitHub username
if [ -z "$1" ]; then
    read -p "GitHub username: " GITHUB_USER
else
    GITHUB_USER=$1
fi

# Repository name
REPO_NAME="watsonx-innovation-hub"

print_status $YELLOW "Setting up repository: $GITHUB_USER/$REPO_NAME"

# Add all files
print_status $YELLOW "Adding files..."
git add .

# Commit
print_status $YELLOW "Creating commit..."
git commit -m "🎉 Initial commit: Watsonx Innovation Hub

Multi-industry AI platform with:
✅ Mental Health Module (DSM-5-TR)
✅ Watsonx Integration
✅ Governance Framework
✅ Comprehensive Tests
✅ Docker & K8s Ready
✅ CI/CD Pipeline"

# Add remote (if not exists)
if ! git remote get-url origin >/dev/null 2>&1; then
    print_status $YELLOW "Adding remote origin..."
    git remote add origin "https://github.com/$GITHUB_USER/$REPO_NAME.git"
fi

# Push
print_status $YELLOW "Pushing to GitHub..."
git push -u origin main

print_status $GREEN "✅ Repository deployed to: https://github.com/$GITHUB_USER/$REPO_NAME"
print_status $BLUE "Next: Configure secrets in GitHub repository settings"