# Leetcodle

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Authentication Flow

This application uses a custom authentication flow with Clerk and Supabase:

1. **Sign-in Process**: When a user attempts to sign in with email/password, the system first validates that the user exists in the Supabase database before allowing Clerk authentication.
2. **Social Login**: Users can sign in with Google or GitHub OAuth providers directly through Clerk.
3. **Sign-up Process**: New users are created through Clerk and automatically added to the Supabase database via webhooks.
4. **User Validation**: The `/api/auth/validate-user` endpoint checks if a user exists in the database before allowing email/password sign-in.

### Key Components:

- Custom sign-in page (`app/sign-in/[[...sign-in]]/page.tsx`) with email/password and social login options
- Custom sign-up page (`app/sign-up/[[...sign-up]]/page.tsx`) with email/password and social login options
- User validation API (`app/api/auth/validate-user/route.ts`)
- Clerk webhook handler (`app/api/webhooks/clerk/route.ts`)

### Authentication Methods:

- **Email/Password**: Validated against your database before allowing sign-in
- **Google OAuth**: Direct integration with Google authentication
- **GitHub OAuth**: Direct integration with GitHub authentication

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
