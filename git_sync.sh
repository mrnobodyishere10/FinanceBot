#!/bin/bash

# Sync the current project with the remote repository
git pull origin main
git add .
git commit -m "Auto-sync: $(date)"
git push origin main