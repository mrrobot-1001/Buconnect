# BUConnect

Alumni & Student Networking Platform for connecting students, alumni, and faculty.

## 🚀 Features

- ✅ User Authentication (Student, Alumni, Admin)
- ✅ Post Creation & Management
- ✅ Comments & Likes
- ✅ User Profiles
- ✅ Admin Dashboard
- ✅ Responsive Design
- ✅ RESTful API with Next.js App Router

## 🛠️ Tech Stack

- **Framework**: Next.js 15 with App Router
- **Database**: MySQL with Prisma ORM
- **Styling**: Tailwind CSS + shadcn/ui components
- **Authentication**: bcryptjs (ready for NextAuth.js)
- **Language**: TypeScript

## 📋 Prerequisites

- Node.js 18+ 
- MySQL 5.7+ or 8.0+
- npm or yarn

## 🔧 Setup Instructions

### 1. Clone and Install

```bash
git clone <repository-url>
cd Buconnect
npm install
```

### 2. Database Setup

Create a MySQL database:
```bash
mysql -u root -p
CREATE DATABASE buconnect;
EXIT;
```

### 3. Environment Configuration

Copy `.env.example` to `.env` and update with your database credentials:

```env
DATABASE_URL="mysql://username:password@localhost:3306/buconnect"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:9002"
```

### 4. Initialize Database

```bash
# Generate Prisma Client
npm run postinstall

# Push schema to database
npm run db:push

# Seed with sample data (optional)
npm run db:seed
```

### 5. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:9002`

## 🔐 Default Login Credentials

After running the seed script:

- **Admin**: priya.s@example.com / password123
- **Student**: rohan@example.com / password123
- **Alumni**: alisha.s@example.com / password123

## 📚 Documentation

- [Backend Setup Guide](./docs/BACKEND_SETUP.md) - Detailed setup instructions
- [Backend Integration Summary](./docs/BACKEND_INTEGRATION_SUMMARY.md) - Changes overview
- [Blueprint](./docs/blueprint.md) - App design and features

## 🗂️ Project Structure

```
src/
├── app/
│   ├── api/              # API routes
│   ├── admin/            # Admin dashboard
│   ├── feed/             # Main feed
│   ├── profile/          # User profiles
│   └── page.tsx          # Login page
├── components/           # React components
├── hooks/                # Custom hooks
└── lib/                  # Utilities & configs

prisma/
├── schema.prisma         # Database schema
└── seed.ts              # Sample data
```

## 📝 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:push      # Push schema to database
npm run db:seed      # Seed database with sample data
npm run db:studio    # Open Prisma Studio
```

## 🎯 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Users
- `GET /api/users` - Get all users
- `GET /api/users/[id]` - Get user by ID
- `PATCH /api/users/[id]` - Update user
- `DELETE /api/users/[id]` - Delete user

### Posts
- `GET /api/posts` - Get all posts
- `POST /api/posts` - Create post
- `GET /api/posts/[id]` - Get post by ID
- `PATCH /api/posts/[id]` - Update post
- `DELETE /api/posts/[id]` - Delete post
- `POST /api/posts/[id]/like` - Toggle like
- `GET /api/posts/[id]/comments` - Get comments
- `POST /api/posts/[id]/comments` - Create comment

## 🔒 Security Notes

Current implementation uses localStorage for session management. For production:
- Implement NextAuth.js for secure authentication
- Add JWT tokens
- Enable CSRF protection
- Implement rate limiting
- Add input validation

## 🚀 Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Manual
1. Set up production database
2. Update environment variables
3. Run `npm run build`
4. Run `npm start`

## 📄 License

MIT

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request
