# Project Management App

A modern project and task management application built with the T3 Stack, featuring project organization, task tracking, and team collaboration capabilities.

## Features

- 🔐 Authentication with NextAuth.js (Email/Password & Google OAuth)
- 📁 Project Management (Create, Read, Update, Delete)
- 📝 Task Management within Projects
- 👥 Team Collaboration and Member Management
- 📊 Project and Task status tracking
- ⚡ Priority levels for tasks (LOW, MEDIUM, HIGH, URGENT)
- 📅 Due date management for projects and tasks
- 👤 User profiles with role-based access
- 🧪 Comprehensive test coverage with Jest
- 🚀 Automated deployment with GitHub Actions
- ☁️ AWS SSET for secure environment management

## Tech Stack

- [Next.js](https://nextjs.org) - React framework for server-rendered applications
- [NextAuth.js](https://next-auth.js.org) - Authentication with Supabase Auth integration
- [Prisma](https://prisma.io) - Database ORM with PostgreSQL
- [tRPC](https://trpc.io) - End-to-end typesafe APIs
- [Tailwind CSS](https://tailwindcss.com) - Utility-first CSS framework
- [shadcn/ui](https://ui.shadcn.com) - Re-usable components built with Radix UI
- [Supabase](https://supabase.com) - Authentication and database services
- [Jest](https://jestjs.io) - Testing framework
- [GitHub Actions](https://github.com/features/actions) - CI/CD automation
- [AWS SSET](https://aws.amazon.com/systems-manager/features/parameter-store/) - Secure parameter storage

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

## Testing

The application uses Jest for unit and integration testing. To run tests:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch


```

Tests are located in the `src/__tests__` directory and follow the naming pattern `*.test.tsx`.

## Deployment

The application is deployed using GitHub Actions and AWS SSET. Here's how it works:

### GitHub Actions Workflow

1. **Continuous Integration**:

   - Runs on every push to main branch
   - Executes test suite
   - Builds the application
   - Validates environment variables

2. **Continuous Deployment**:
   - Deploys to AWS on successful CI
   - Uses AWS SSET for secure environment variables
   - Automatically updates the production environment

### AWS SSET Integration

1. **Environment Variables**:

   - All sensitive configuration is stored in AWS SSET
   - Parameters are automatically injected during deployment
   - Secure access through IAM roles

2. **Deployment Process**:
   - GitHub Actions workflow triggers on main branch updates
   - AWS SSET parameters are fetched
   - Application is built with production configuration
   - Deployed to AWS infrastructure

## Database Schema

The application uses the following main tables:

- `User` - User profiles, authentication, and role management
- `Project` - Project management with status and team assignments
- `Task` - Task management within projects
- `ProjectMember` - Project team member assignments
- `TaskAssignment` - Task assignments to team members
- `Tag` - Project and task categorization
- `ProjectTag` - Many-to-many relationship between projects and tags
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

## User Profiles

The application includes comprehensive user profile management:

- Personal information management
- Profile picture upload and management
- Role-based access control
- Project and task assignment history
- Activity tracking and notifications

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
