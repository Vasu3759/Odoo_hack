@echo off
echo Starting AssetFlow development environment...

echo [1/4] Starting Docker database container...
docker-compose up -d

echo [2/4] Installing dependencies...
call npm install

echo [3/4] Setting up the database (this may take a moment)...
call npx prisma generate
call npx prisma db push --accept-data-loss
call node seed.js
call node make_admin.js

echo [4/4] Starting server...
call npm run dev
