# Project Documentation: Buconnect

## 1. Project Overview
**Buconnect** is a social networking platform designed for students and alumni, likely for a university or educational institution context. It facilitates connections, posts, comments, and profile management with role-based access (Student, Alumni, Admin).

## 2. Technology Stack

### Core Framework
-   **Next.js 15.3.3**: The React framework for production, utilizing the App Router for routing and layouts.
-   **TypeScript**: Statically typed JavaScript for better developer experience and code quality.
-   **React 18**: The library for web and native user interfaces.

### Styling & UI
-   **Tailwind CSS**: A utility-first CSS framework for rapid UI development.
-   **Radix UI**: A collection of unstyled, accessible UI primitives (Accordion, Dialog, Dropdown, Tabs, etc.).
-   **Lucide React**: A library of beautiful, consistent icons.
-   **Shadcn UI (Inferred)**: The usage of `class-variance-authority`, `clsx`, `tailwind-merge`, and Radix UI primitives strongly suggests the use of Shadcn UI components.
-   **Recharts**: A composable charting library built on React components.

### Database & ORM
-   **PostgreSQL**: The relational database management system.
-   **Prisma**: Next-generation Node.js and TypeScript ORM.
    -   **Schema**: Defines `User`, `Post`, `Like`, `Comment`, `Connection` models.
    -   **Seed**: Includes a seeding script (`prisma/seed.ts`).

### Authentication & Backend Services
-   **Supabase**: An open-source Firebase alternative.
    -   **Auth**: Handles user authentication (`@supabase/ssr`, `@supabase/supabase-js`).
    -   **Database**: Likely hosts the PostgreSQL database.
-   **Firebase**: Included in dependencies (`firebase`), possibly for specific services like App Hosting (`apphosting.yaml`) or legacy integration.

### AI Integration
-   **Genkit**: Google's AI SDK (`@genkit-ai/google-genai`, `@genkit-ai/next`).
    -   Located in `src/ai`.
    -   Scripts for dev and watch mode in `package.json`.

### Forms & Validation
-   **React Hook Form**: Performant, flexible and extensible forms with easy-to-use validation.
-   **Zod**: TypeScript-first schema declaration and validation library.
-   **@hookform/resolvers**: Bridges Zod with React Hook Form.

### Utilities
-   **Date-fns**: Modern JavaScript date utility library.
-   **Bcryptjs**: Library to help hash passwords.
-   **Dotenv**: Loads environment variables from `.env` file.

## 3. Project Structure

```
/Users/harsh/projects/Buconnect
├── .env*                 # Environment variables
├── prisma/               # Database schema and migrations
│   ├── schema.prisma     # Data model definition
│   └── seed.ts           # Database seeding script
├── public/               # Static assets
├── src/
│   ├── ai/               # Genkit AI configuration and logic
│   ├── app/              # Next.js App Router pages and layouts
│   ├── components/       # Reusable UI components
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility functions, auth logic, definitions
│   │   └── supabase/     # Supabase client initialization
│   └── globals.css       # Global styles (Tailwind directives)
├── next.config.ts        # Next.js configuration
├── tailwind.config.ts    # Tailwind CSS configuration
└── package.json          # Project dependencies and scripts
```

## 4. Database Schema Summary

The database is structured around the **User** entity with the following key relationships:

-   **User**:
    -   Roles: `STUDENT`, `ALUMNI`, `ADMIN`.
    -   Profile info: `bio`, `profileImage`, `course`, `batch`, `profession`.
    -   Relations: `posts`, `comments`, `likes`, `following`, `followers`.
-   **Post**:
    -   Content: `title`, `content`, `imageUrl`.
    -   Relations: Belongs to `User` (author), has many `Comment`s and `Like`s.
-   **Connection**:
    -   Represents a follow relationship between two Users (`follower` and `following`).
-   **Interaction**:
    -   **Comment**: Text response to a post.
    -   **Like**: Binary engagement on a post.

## 5. Key Configuration

-   **Next.js**:
    -   Configured to ignore TypeScript and ESLint errors during build (`ignoreBuildErrors: true`, `ignoreDuringBuilds: true`).
    -   Remote image patterns configured for `placehold.co`, `images.unsplash.com`, and `picsum.photos`.
-   **Scripts**:
    -   `dev`: Runs Next.js dev server with Turbopack.
    -   `genkit:dev`: Starts Genkit development environment.
    -   `db:push`: Pushes Prisma schema state to the database.
    -   `db:seed`: Runs the seeding script.
