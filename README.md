# Korella CRM

Modern CRM platform designed for real estate professionals (realtors, agents, and loan officers).

## Project Status

🚧 **In Development** - Project setup phase

## Tech Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS
- **State**: TanStack Query v5, Zustand
- **Forms**: React Hook Form + Zod
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **Auth**: Better Auth (OAuth + Email/Password)
- **Email**: Resend (transactional)
- **Monitoring**: Sentry
- **Deployment**: Vercel

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:3000
```

## Project Structure

```
app/
├── (auth)/          # Public authentication pages
├── (dashboard)/     # Protected application pages
└── api/             # API routes

lib/                 # Utility functions and configurations
features/            # Feature-based modules
components/          # Reusable UI components
supabase/            # Database migrations
tests/               # Test files
```

## Documentation

See `.claude/` directory for:

- PRDs (Product Requirements Documents)
- Epics (Technical implementation plans)
- Context documentation
- Project management files

## License

Proprietary - All rights reserved
