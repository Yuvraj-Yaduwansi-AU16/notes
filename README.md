# Task Management App

A modern task management application built with the T3 Stack, featuring task creation, assignment, and tracking capabilities.

## Features

- 🔐 Authentication with NextAuth.js (Email/Password & Google OAuth)
- 📝 Create, update, and delete tasks
- 👥 Assign tasks to team members
- 🏷️ Tag-based task organization
- 📊 Task status tracking (TODO, IN_PROGRESS, REVIEW, DONE)
- ⚡ Priority levels (LOW, MEDIUM, HIGH, URGENT)
- 📅 Due date management
- 👤 User profiles and management

## Tech Stack

- [Next.js](https://nextjs.org) - React framework for server-rendered applications
- [NextAuth.js](https://next-auth.js.org) - Authentication with Supabase Auth integration
- [Prisma](https://prisma.io) - Database ORM with PostgreSQL
- [tRPC](https://trpc.io) - End-to-end typesafe APIs
- [Tailwind CSS](https://tailwindcss.com) - Utility-first CSS framework
- [shadcn/ui](https://ui.shadcn.com) - Re-usable components built with Radix UI
- [Supabase](https://supabase.com) - Authentication and database services

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:

   ```env
   DATABASE_URL="your_postgresql_url"
   NEXTAUTH_SECRET="your_nextauth_secret"
   NEXTAUTH_URL="http://localhost:3000"

   # Supabase
   NEXT_PUBLIC_SUPABASE_URL="your_supabase_url"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your_supabase_anon_key"

   # Google OAuth
   AUTH_GOOGLE_ID="your_google_client_id"
   AUTH_GOOGLE_SECRET="your_google_client_secret"
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

## Database Schema

The application uses the following main tables:

- `User` - User profiles and authentication
- `Task` - Task management with status and priority
- `Tag` - Task categorization
- `TaskAssignment` - Task assignments to users
- `TaskTag` - Many-to-many relationship between tasks and tags

## Authentication Flow

1. Email/Password:

   - User signs up with email and password
   - Account created in Supabase Auth
   - User profile created in Prisma database
   - NextAuth session established

2. Google OAuth:
   - User signs in with Google
   - Account created in Supabase Auth
   - User profile created in Prisma database
   - NextAuth session established

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
