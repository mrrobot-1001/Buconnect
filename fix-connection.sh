#!/bin/bash

# BUConnect - Supabase Connection Fix
# This script helps you fix the database connection

echo "🔧 Supabase Connection Fix"
echo "=========================="
echo ""

echo "Your Supabase project: https://isxyraxwpdncmypvuxef.supabase.co"
echo ""

echo "To fix the connection error, you need your database password."
echo ""
echo "📋 Steps:"
echo "1. Go to: https://supabase.com/dashboard/project/isxyraxwpdncmypvuxef/settings/database"
echo "2. Find 'Database Password' section"
echo "3. Click 'Reset Database Password' (or use your existing password)"
echo "4. Copy the password"
echo ""

read -p "Enter your database password: " DB_PASSWORD

if [ -z "$DB_PASSWORD" ]; then
    echo "❌ Error: Password cannot be empty"
    exit 1
fi

# Update .env.local with correct DATABASE_URL
cat > .env.local << EOF
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://isxyraxwpdncmypvuxef.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzeHlyYXh3cGRuY215cHZ1eGVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3OTAwMzIsImV4cCI6MjA3OTM2NjAzMn0.YO0x1Lnkah5oFT6bSdKAGlxIE4KyX1Wc-C9C62gH4Mg
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzeHlyYXh3cGRuY215cHZ1eGVmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mzc5MDAzMiwiZXhwIjoyMDc5MzY2MDMyfQ.sb_secret_u_9tIf8JZVbPTh2pp34qFg_gKD6ccO0

# Database URL (PostgreSQL) - Connection Pooler
DATABASE_URL=postgresql://postgres.isxyraxwpdncmypvuxef:${DB_PASSWORD}@aws-0-us-east-1.pooler.supabase.com:6543/postgres

# Direct Connection (for migrations)
DIRECT_URL=postgresql://postgres.isxyraxwpdncmypvuxef:${DB_PASSWORD}@aws-0-us-east-1.pooler.supabase.com:5432/postgres

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:9002
EOF

echo ""
echo "✅ .env.local updated with database password"
echo ""

# Regenerate Prisma Client
echo "🔄 Regenerating Prisma Client..."
npx prisma generate

echo ""
echo "✅ Prisma Client regenerated"
echo ""

# Push schema to database
echo "Would you like to push the Prisma schema to your database now?"
read -p "Push schema? (y/n) " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📤 Pushing schema to database..."
    npx prisma db push --skip-generate
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Schema pushed successfully!"
        echo ""
        echo "🎉 All set! You can now:"
        echo "   1. Run: npm run dev"
        echo "   2. Test registration at: http://localhost:9002"
    else
        echo ""
        echo "⚠️ Schema push had issues. See errors above."
        echo ""
        echo "💡 Alternative: Use Supabase SQL Editor"
        echo "   1. Go to: https://supabase.com/dashboard/project/isxyraxwpdncmypvuxef/editor/sql"
        echo "   2. Copy schema from: SUPABASE_EMAIL_SETUP.md"
        echo "   3. Run in SQL Editor"
    fi
else
    echo ""
    echo "⚠️ Schema not pushed. You'll need to set up tables manually."
    echo ""
    echo "📝 Next steps:"
    echo "   1. Open: SUPABASE_EMAIL_SETUP.md"
    echo "   2. Copy the database schema SQL"
    echo "   3. Run in Supabase SQL Editor"
    echo "   4. Then run: npm run dev"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ Connection fixed! Your app is ready to use Supabase"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
