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
