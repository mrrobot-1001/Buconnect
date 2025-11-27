#!/bin/bash

echo "🚀 BUConnect Backend Setup Script"
echo "=================================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "📝 Creating .env from .env.example..."
    cp .env.example .env
    echo "✅ .env file created. Please update it with your database credentials."
    echo "   Edit .env and update DATABASE_URL before continuing."
    echo ""
    read -p "Press Enter once you've updated .env file..."
fi

echo "📦 Installing dependencies..."
npm install

echo ""
echo "🗄️  Setting up database..."
echo "Pushing schema to database..."
npm run db:push

echo ""
read -p "Would you like to seed the database with sample data? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo "🌱 Seeding database..."
    npm run db:seed
    echo ""
    echo "✅ Database seeded successfully!"
    echo ""
    echo "📝 Login Credentials:"
    echo "   Admin:   priya.s@example.com / password123"
    echo "   Student: rohan@example.com / password123"
    echo "   Alumni:  alisha.s@example.com / password123"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "🚀 Start the development server with:"
echo "   npm run dev"
echo ""
echo "🔍 View database with Prisma Studio:"
echo "   npm run db:studio"
echo ""
