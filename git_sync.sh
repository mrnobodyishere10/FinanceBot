#!/bin/bash

echo "=== Sinkronisasi dengan GitHub ==="

# Pastikan berada di root folder FinanceBot
cd FinanceBot

# Sinkronisasi branch lokal dengan remote
git pull origin main --rebase

# Push perubahan lokal ke GitHub
git push -u origin main

echo "=== Push selesai, repository GitHub sudah diperbarui ==="
