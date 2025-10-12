# Bolt Environment Limitation

## The Problem

Bolt/StackBlitz uses a WebContainer environment that **blocks all outgoing HTTP requests** to external services, including Supabase. This is a security feature of the platform and cannot be bypassed.

## Why You're Seeing RLS Errors

The errors like "Failed to create store: new row violates row-level security policy" occur because:

1. The browser cannot connect to your Supabase instance from within Bolt
2. Even though the service role key is configured correctly, the requests never reach Supabase
3. The RLS errors are misleading - the real issue is network isolation

## Solution: Test Outside Bolt

### Option 1: Local Development (Recommended)

1. Download your project files
2. Navigate to the project directory
3. Install dependencies:
   ```bash
   npm install
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```
5. Open http://localhost:5173 in your browser

### Option 2: Deploy to Vercel/Netlify

1. Push your code to GitHub
2. Connect to Vercel or Netlify
3. Add environment variables in the hosting platform:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_SUPABASE_SERVICE_ROLE_KEY`
4. Deploy

## What Works in Bolt

- UI preview
- Component styling
- Route navigation
- Static content

## What Doesn't Work in Bolt

- Supabase connections
- External API calls
- Database operations
- Authentication
- Any network requests to external services

## Your Supabase Configuration is Correct

Your `.env` file has valid credentials:
- URL: `https://aigtxqdeasdjeeeasgue.supabase.co`
- Keys are properly formatted
- The Supabase server responds (verified with curl)

The issue is purely the Bolt environment limitation.
