# Recallio - Language Learning Platform

A modern language learning platform focused on German-English-Bangla translations, built with Next.js, TypeScript, and PostgreSQL.

## Features

- 🔐 Authentication with Google OAuth and Email/Password
- 📚 Word management system with German-English-Bangla translations
- 🎯 Spaced repetition learning system
- 📱 Mobile-first responsive design
- 🌓 Dark/Light theme support
- 🔍 Advanced search with filters
- 📊 Progress tracking

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Shadcn/ui
- **Backend**: Next.js API Routes
- **Database**: Neon PostgreSQL with Drizzle ORM
- **Authentication**: NextAuth.js
- **Form Handling**: React Hook Form with Zod validation
- **State Management**: TanStack Query
- **Styling**: Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (Neon recommended)
- Google OAuth credentials

### Environment Setup

Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL="your-neon-postgresql-url"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Node Environment
NODE_ENV="development"
```

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/recallio.git
   cd recallio
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up the database:
   ```bash
   npm run db:generate
   npm run db:migrate
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:3000`.

## Project Structure

```
src/
├── app/                 # Next.js app directory
│   ├── api/            # API routes
│   ├── auth/           # Authentication pages
│   └── (routes)/       # Application routes
├── components/         # React components
├── lib/               # Utility functions and configurations
│   ├── db/           # Database configuration and schema
│   └── auth/         # Authentication utilities
└── types/            # TypeScript type definitions
```

## Development

### Database Migrations

To create a new migration:
```bash
npm run db:generate
```

To apply migrations:
```bash
npm run db:migrate
```

### Code Style

This project uses ESLint and Prettier for code formatting. To format your code:
```bash
npm run format
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
