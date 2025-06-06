# Advisor Schedule Application

A Calendly-like scheduling tool for professional meetings and consultations.

## Setup

### Required Environment Variables

```
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/advisorapp"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your_nextauth_secret_key"

# Google OAuth for login
AUTH_GOOGLE_ID="your_AUTH_GOOGLE_ID"
AUTH_GOOGLE_SECRET="your_AUTH_GOOGLE_SECRET"

# Email Service
EMAIL_SERVER_HOST="smtp.example.com"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_SECURE="false"
EMAIL_SERVER_USER="your_email@example.com"
EMAIL_SERVER_PASSWORD="your_email_password"
EMAIL_FROM="no-reply@yourdomain.com"

# Google API for Calendar integration
GOOGLE_API_KEY="your_google_api_key"

# Gemini AI API Key (for context enhancement)
GOOGLE_GEMINI_API_KEY="your_gemini_api_key"

# HubSpot API Keys
HUBSPOT_CLIENT_ID="your_hubspot_client_id"
HUBSPOT_CLIENT_SECRET="your_hubspot_client_secret"
```

### Development Setup

1. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

2. Run database migrations:
```bash
npx prisma migrate dev
```

3. Start the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Features

- Google login and calendar integration
- HubSpot CRM integration
- LinkedIn profile data integration
- Scheduling windows with multiple time slots
- Scheduling links with customizable settings
- AI-enhanced client responses
- Email notifications

## LinkedIn Integration Notes

The LinkedIn integration functionality requires proper API setup:

1. LinkedIn's official API (requires partner program approval)
2. A third-party LinkedIn data provider
3. Proper OAuth2 configuration for authentication 