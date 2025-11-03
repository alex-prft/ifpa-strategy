import { OptimizelyConfig, MSGraphConfig } from '../types';

// Environment configuration getter with validation
export function getOptimizelyConfig(): OptimizelyConfig {
  const requiredEnvVars = [
    'ODP_API_KEY',
    'ODP_PROJECT_ID',
    'EXPERIMENTATION_API_KEY',
    'EXPERIMENTATION_PROJECT_ID',
    'CONTENT_RECS_API_KEY',
    'CONTENT_RECS_ACCOUNT_ID',
    'CMP_API_KEY',
    'CMP_WORKSPACE_ID'
  ];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }

  return {
    odp: {
      api_key: process.env.ODP_API_KEY!,
      project_id: process.env.ODP_PROJECT_ID!,
      base_url: process.env.ODP_BASE_URL || 'https://function.zaius.com/twilio_segment'
    },
    experimentation: {
      api_key: process.env.EXPERIMENTATION_API_KEY!,
      project_id: process.env.EXPERIMENTATION_PROJECT_ID!,
      base_url: process.env.EXPERIMENTATION_BASE_URL || 'https://api.optimizely.com/v2'
    },
    content_recs: {
      api_key: process.env.CONTENT_RECS_API_KEY!,
      account_id: process.env.CONTENT_RECS_ACCOUNT_ID!,
      base_url: process.env.CONTENT_RECS_BASE_URL || 'https://api.idio.co'
    },
    cmp: {
      api_key: process.env.CMP_API_KEY!,
      workspace_id: process.env.CMP_WORKSPACE_ID!,
      base_url: process.env.CMP_BASE_URL || 'https://api.optimizely.com/v2'
    }
  };
}

export function getMSGraphConfig(): MSGraphConfig {
  const requiredEnvVars = [
    'MS_GRAPH_TENANT_ID',
    'MS_GRAPH_CLIENT_ID',
    'MS_GRAPH_CLIENT_SECRET',
    'MS_GRAPH_SENDER_EMAIL'
  ];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }

  return {
    tenant_id: process.env.MS_GRAPH_TENANT_ID!,
    client_id: process.env.MS_GRAPH_CLIENT_ID!,
    client_secret: process.env.MS_GRAPH_CLIENT_SECRET!,
    sender_email: process.env.MS_GRAPH_SENDER_EMAIL!
  };
}

export function getAPISecretKey(): string {
  const secretKey = process.env.API_SECRET_KEY;
  if (!secretKey) {
    throw new Error('Missing required environment variable: API_SECRET_KEY');
  }
  return secretKey;
}

export function getBaseURL(): string {
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}