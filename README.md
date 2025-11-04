# Opal AI Personalization System 2025

This is an advanced AI-powered personalization maturity assessment and strategy generation system built with [Next.js](https://nextjs.org), featuring comprehensive integration with the Optimizely ecosystem and designed for seamless Opal workflow automation.

## System Features

### 🤖 AI-Powered Personalization Engine
- **Maturity Assessment**: Scientific 6-category evaluation (1-5 scale)
- **Audience Generation**: 3-5 data-driven segments using ODP + Salesforce
- **Idea Creation**: 4-6 personalization concepts per audience
- **Experiment Blueprints**: Production-ready specifications with statistical rigor
- **Plan Composition**: Comprehensive strategy with 30/60/90 roadmaps

### 🔧 Technical Architecture
- ⚡ Next.js 16 with App Router
- 📝 TypeScript for type safety
- 🛠️ 5 Custom Tools for Optimizely integration
- 🔐 Bearer token authentication with audit logging
- 📊 ID resolution priority enforcement
- 🚀 Ready for Vercel deployment

### 🎯 Opal Integration
- **Tool Discovery**: Complete registry for Opal registration
- **Specialized Agents**: JSON configurations for workflow automation
- **Instructions**: Governance rules for KPIs, data privacy, and brand consistency
- **Workflow Orchestration**: End-to-end personalization strategy generation

## Getting Started

### Prerequisites

- Node.js 20.9.0 or higher
- npm, yarn, pnpm, or bun

### Development

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Run the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Deployment Instructions

### GitHub Setup

1. **Authenticate GitHub CLI** (if not already done):
```bash
gh auth login
```

2. **Create GitHub repository and push code**:
```bash
gh repo create my-nextjs-app --public --confirm
git remote add origin https://github.com/alex-prft/opal-2025.git
git push -u origin main
```

### Vercel Deployment

1. **Option A: Deploy via Vercel CLI**
   - Install Vercel CLI: `npm i -g vercel`
   - Run: `vercel --prod`
   - Follow the prompts

2. **Option B: Deploy via Vercel Dashboard**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with your GitHub account
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js and deploy

3. **Option C: One-click deploy**
   - Use this button: [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/alex-prft/opal-2025)

## Project Structure

```
my-nextjs-app/
├── src/
│   └── app/
│       ├── globals.css
│       ├── layout.tsx
│       └── page.tsx
├── public/
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── vercel.json
```

## Environment Variables

The application requires several environment variables to be configured. Create a `.env.local` file in the root directory:

### Required Variables

#### Optimizely Data Platform (ODP)
```bash
ODP_API_KEY=your_odp_api_key
ODP_PROJECT_ID=your_odp_project_id
ODP_BASE_URL=https://function.zaius.com/twilio_segment  # Optional, defaults shown
```

#### Optimizely Experimentation
```bash
EXPERIMENTATION_API_KEY=your_experimentation_api_key
EXPERIMENTATION_PROJECT_ID=your_experimentation_project_id
EXPERIMENTATION_BASE_URL=https://api.optimizely.com/v2  # Optional, defaults shown
```

#### Optimizely Content Recommendations
```bash
CONTENT_RECS_API_KEY=your_content_recs_api_key
CONTENT_RECS_ACCOUNT_ID=your_content_recs_account_id
CONTENT_RECS_BASE_URL=https://api.idio.co  # Optional, defaults shown
```

#### Optimizely CMP (Campaign Management Platform)
```bash
CMP_API_KEY=your_cmp_api_key
CMP_WORKSPACE_ID=your_cmp_workspace_id
CMP_BASE_URL=https://api.optimizely.com/v2  # Optional, defaults shown
```

#### SendGrid Email Service
```bash
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_SENDER_EMAIL=noreply@yourdomain.com
SENDGRID_SENDER_NAME="Opal AI Personalization System"  # Optional, defaults shown
```

#### Application Configuration
```bash
API_SECRET_KEY=your_secure_secret_key_for_api_authentication
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app  # Optional, defaults to localhost:3000
```

### Vercel Deployment

When deploying to Vercel, add these environment variables in your project settings:

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add each variable with its corresponding value
4. Select the appropriate environments (Production, Preview, Development)

### Security Notes

- Never commit `.env.local` or `.env` files to version control
- Use strong, unique values for `API_SECRET_KEY`
- Ensure SendGrid API key has appropriate permissions for sending emails
- Validate that all Optimizely API keys have the necessary scopes

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Vercel Deployment Documentation](https://nextjs.org/docs/app/building-your-application/deploying)
