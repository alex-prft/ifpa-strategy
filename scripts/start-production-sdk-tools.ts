#!/usr/bin/env node

/**
 * Production-Ready SDK Tools Service Launcher
 *
 * Handles TypeScript compilation challenges and provides multiple startup approaches
 * for maximum reliability and production readiness.
 */

import { execSync } from 'child_process';
import { existsSync, writeFileSync } from 'fs';
import { join } from 'path';

const PORT = process.env.OPAL_TOOLS_PORT ? parseInt(process.env.OPAL_TOOLS_PORT) : 3001;

interface StartupConfig {
  useProductionSDK: boolean;
  enableDecorators: boolean;
  fallbackToBasic: boolean;
  environment: string;
}

function getStartupConfig(): StartupConfig {
  return {
    useProductionSDK: process.env.USE_PRODUCTION_SDK === 'true',
    enableDecorators: process.env.ENABLE_DECORATORS !== 'false',
    fallbackToBasic: process.env.FALLBACK_TO_BASIC === 'true',
    environment: process.env.NODE_ENV || 'development'
  };
}

async function createBasicSDKService() {
  console.log('🔧 [Fallback Mode] Creating basic SDK service without decorators...');

  const basicServiceCode = `
import express from 'express';
import { getEnvironmentConfig } from '../src/lib/opal/production-ready-sdk-tools';

const PORT = ${PORT};

// Basic Express service without decorators
async function startBasicSDKService() {
  try {
    const app = express();
    app.use(express.json());

    const envConfig = getEnvironmentConfig();

    // Health check
    app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        mode: 'basic_fallback',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        config: envConfig
      });
    });

    // Basic discovery endpoint
    app.get('/discovery', (req, res) => {
      res.json({
        name: "OSA Enhanced Tools (Basic Mode)",
        description: "SDK tools running in fallback mode",
        version: "2.0.0-basic",
        tools: [
          {
            name: "analyze_website_content_enhanced",
            description: "Content analysis with enhanced features",
            available: false,
            reason: "Decorator compilation issues - use API endpoints instead"
          },
          {
            name: "send_data_to_osa_enhanced",
            description: "Enhanced webhook delivery",
            available: true,
            endpoint: envConfig.webhookUrl
          }
        ],
        sdk_version: "@optimizely-opal/opal-tools-sdk@0.1.3-dev",
        mode: "basic_fallback"
      });
    });

    // Enhanced webhook endpoint that bypasses decorators
    app.post('/tools/send_data_to_osa_enhanced', async (req, res) => {
      try {
        const { agent_id, agent_data, workflow_id, execution_status } = req.body;

        // Use the webhook logic without decorators
        const authKey = process.env.OPAL_WEBHOOK_AUTH_KEY || 'development-key-for-local-testing-32char-minimum-length';

        const webhookPayload = {
          event_type: 'agent.completed',
          workflow_id,
          timestamp: new Date().toISOString(),
          agent_id,
          agent_output: {
            ...agent_data,
            sdk_enhanced: true,
            basic_mode: true
          },
          agent_success: execution_status === 'completed',
          metadata: {
            sdk_version: '@optimizely-opal/opal-tools-sdk@0.1.3-dev',
            delivery_method: 'basic_mode_enhanced'
          }
        };

        const response = await fetch(envConfig.webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': \`Bearer \${authKey}\`,
            'X-OPAL-SDK-Mode': 'basic-fallback'
          },
          body: JSON.stringify(webhookPayload)
        });

        if (response.ok) {
          const result = await response.json();
          res.json({
            success: true,
            tool_name: 'send_data_to_osa_enhanced',
            mode: 'basic_fallback',
            webhook_delivered: true,
            osa_response: result
          });
        } else {
          throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
        }

      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          mode: 'basic_fallback'
        });
      }
    });

    app.listen(PORT, () => {
      console.log(\`✅ Basic SDK Tools Service started on port \${PORT}\`);
      console.log(\`📡 Discovery: http://localhost:\${PORT}/discovery\`);
      console.log(\`🔧 Enhanced Webhook: http://localhost:\${PORT}/tools/send_data_to_osa_enhanced\`);
      console.log(\`🌍 Environment: \${JSON.stringify(envConfig, null, 2)}\`);
    });

  } catch (error) {
    console.error('❌ Basic SDK service failed:', error);
    process.exit(1);
  }
}

startBasicSDKService();
  `;

  const basicServicePath = join(process.cwd(), 'scripts', 'basic-sdk-service.js');
  writeFileSync(basicServicePath, basicServiceCode);

  return basicServicePath;
}

async function startProductionSDKTools() {
  const config = getStartupConfig();

  console.log('🚀 [Production SDK Tools] Starting service...');
  console.log('📋 [Configuration]', JSON.stringify(config, null, 2));

  if (config.fallbackToBasic) {
    console.log('🔄 [Fallback Mode] Using basic service without decorators');
    const basicServicePath = await createBasicSDKService();

    try {
      execSync(`node "${basicServicePath}"`, { stdio: 'inherit' });
    } catch (error) {
      console.error('❌ [Fallback Mode] Basic service failed:', error);
      process.exit(1);
    }
    return;
  }

  // Try different compilation approaches
  const compilationStrategies = [
    {
      name: 'tsx-with-loader',
      command: `npx tsx --loader ts-node/esm scripts/start-production-sdk-tools.ts`
    },
    {
      name: 'ts-node-esm',
      command: `npx ts-node --esm --project tsconfig.sdk.json src/lib/opal/production-ready-sdk-tools.ts`
    },
    {
      name: 'typescript-compile',
      command: `npx tsc --project tsconfig.sdk.json && node dist/production-ready-sdk-tools.js`
    }
  ];

  for (const strategy of compilationStrategies) {
    try {
      console.log(`🔄 [Strategy] Trying ${strategy.name}...`);

      if (strategy.name === 'typescript-compile') {
        // First compile
        execSync('npx tsc --project tsconfig.sdk.json', { stdio: 'pipe' });
        console.log('✅ [Compilation] TypeScript compilation successful');

        // Then run
        const distPath = join(process.cwd(), 'dist', 'src', 'lib', 'opal', 'production-ready-sdk-tools.js');
        if (existsSync(distPath)) {
          execSync(`node "${distPath}"`, { stdio: 'inherit' });
        } else {
          throw new Error('Compiled file not found');
        }
      } else {
        execSync(strategy.command, { stdio: 'inherit' });
      }

      console.log(\`✅ [Success] Started using \${strategy.name}\`);
      return;

    } catch (error) {
      console.warn(\`⚠️ [Strategy Failed] \${strategy.name}: \${error instanceof Error ? error.message : 'Unknown error'}\`);
      continue;
    }
  }

  // If all strategies failed, fall back to basic mode
  console.warn('⚠️ [All Strategies Failed] Falling back to basic mode...');
  process.env.FALLBACK_TO_BASIC = 'true';
  await startProductionSDKTools();
}

// Enhanced error handling
process.on('uncaughtException', (error) => {
  console.error('❌ [Uncaught Exception]:', error);
  console.log('🔄 [Recovery] Attempting to start basic fallback service...');

  process.env.FALLBACK_TO_BASIC = 'true';
  startProductionSDKTools().catch(() => {
    console.error('❌ [Critical] All recovery attempts failed');
    process.exit(1);
  });
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ [Unhandled Rejection]:', reason);
  console.log('🔄 [Recovery] Service will continue running...');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\\n🛑 [Shutdown] Gracefully shutting down SDK Tools Service...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\\n🛑 [Shutdown] Gracefully shutting down SDK Tools Service...');
  process.exit(0);
});

// Start the service
if (require.main === module) {
  startProductionSDKTools().catch((error) => {
    console.error('❌ [Startup Failed]:', error);
    process.exit(1);
  });
}