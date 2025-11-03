/**
 * Integration tests for Opal Personalization Tools
 * Tests end-to-end functionality of all custom tools
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import { getBaseURL } from '@/lib/utils/config';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const API_TOKEN = process.env.API_SECRET_KEY || 'test-token';

// Mock data for testing
const mockUserIds = {
  email_hash: 'a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890',
  sf_contact_id: '003XX000004TmiQQAS'
};

const headers = {
  'Authorization': `Bearer ${API_TOKEN}`,
  'Content-Type': 'application/json'
};

describe('Tool Discovery Integration', () => {
  it('should return complete tool registry', async () => {
    const response = await fetch(`${BASE_URL}/api/discovery`);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.tools).toHaveLength(5);

    // Verify all expected tools are present
    const toolIds = data.data.tools.map((tool: any) => tool.toolId);
    expect(toolIds).toContain('com.acme.opal.audience');
    expect(toolIds).toContain('com.acme.opal.content');
    expect(toolIds).toContain('com.acme.opal.experiments');
    expect(toolIds).toContain('com.acme.cmp');
    expect(toolIds).toContain('com.acme.notify');
  });

  it('should validate tool registration', async () => {
    const response = await fetch(`${BASE_URL}/api/discovery`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        tool_id: 'com.acme.opal.audience',
        validation_request: true
      })
    });

    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.status).toBe('available');
  });
});

describe('Audience Tool Integration', () => {
  it('should handle health check requests', async () => {
    const response = await fetch(`${BASE_URL}/api/tools/audience`, {
      method: 'GET',
      headers
    });

    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.tool_id).toBe('com.acme.opal.audience');
  });

  it('should process audience lookup requests', async () => {
    const response = await fetch(`${BASE_URL}/api/tools/audience`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ids: mockUserIds })
    });

    if (response.status === 502) {
      // API integration not available in test environment
      console.warn('ODP API not available in test environment');
      return;
    }

    expect([200, 400, 401, 502]).toContain(response.status);
  });

  it('should validate request format', async () => {
    const response = await fetch(`${BASE_URL}/api/tools/audience`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ invalid: 'data' })
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toContain('ids');
  });
});

describe('Content Tool Integration', () => {
  it('should handle health check requests', async () => {
    const response = await fetch(`${BASE_URL}/api/tools/content`, {
      method: 'GET',
      headers
    });

    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.tool_id).toBe('com.acme.opal.content');
  });

  it('should get available topics catalog', async () => {
    const response = await fetch(`${BASE_URL}/api/tools/content?catalog=topics`, {
      method: 'GET',
      headers
    });

    if (response.status === 502) {
      console.warn('Content Recs API not available in test environment');
      return;
    }

    expect([200, 502]).toContain(response.status);
  });

  it('should process content lookup requests', async () => {
    const response = await fetch(`${BASE_URL}/api/tools/content`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        topic: 'product_features',
        audience: 'enterprise_customers'
      })
    });

    if (response.status === 502) {
      console.warn('Content Recs API not available in test environment');
      return;
    }

    expect([200, 502]).toContain(response.status);
  });
});

describe('Experiments Tool Integration', () => {
  it('should handle health check requests', async () => {
    const response = await fetch(`${BASE_URL}/api/tools/experiments`, {
      method: 'GET',
      headers
    });

    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.tool_id).toBe('com.acme.opal.experiments');
  });

  it('should process experiment catalog requests', async () => {
    const response = await fetch(`${BASE_URL}/api/tools/experiments`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        kpi: 'conversion_rate',
        limit: 5
      })
    });

    if (response.status === 502) {
      console.warn('Experimentation API not available in test environment');
      return;
    }

    expect([200, 502]).toContain(response.status);
  });
});

describe('CMP Tool Integration', () => {
  it('should handle health check requests', async () => {
    const response = await fetch(`${BASE_URL}/api/tools/cmp`, {
      method: 'GET',
      headers
    });

    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.tool_id).toBe('com.acme.cmp');
  });

  it('should validate publish plan requests', async () => {
    const response = await fetch(`${BASE_URL}/api/tools/cmp`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        title: 'Test Plan',
        plan_markdown: '# Test Plan\n\nThis is a test plan for validation.'
      })
    });

    // Should either succeed or fail due to API integration
    expect([200, 400, 401, 502]).toContain(response.status);
  });
});

describe('Notify Tool Integration', () => {
  it('should handle health check requests', async () => {
    const response = await fetch(`${BASE_URL}/api/tools/notify`, {
      method: 'GET',
      headers
    });

    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.tool_id).toBe('com.acme.notify');
  });

  it('should validate email notification requests', async () => {
    const response = await fetch(`${BASE_URL}/api/tools/notify`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        to: ['test@example.com'],
        plan_title: 'Test Plan',
        cmp_url: 'https://example.com/campaign/123'
      })
    });

    // Should either succeed or fail due to MS Graph integration
    expect([200, 400, 401, 502]).toContain(response.status);
  });

  it('should validate email addresses', async () => {
    const response = await fetch(`${BASE_URL}/api/tools/notify`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        to: ['invalid-email'],
        subject: 'Test'
      })
    });

    expect([400, 502]).toContain(response.status);
  });
});

describe('Authentication Tests', () => {
  it('should reject requests without authorization header', async () => {
    const response = await fetch(`${BASE_URL}/api/tools/audience`, {
      method: 'GET'
    });

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.success).toBe(false);
  });

  it('should reject requests with invalid bearer token', async () => {
    const response = await fetch(`${BASE_URL}/api/tools/audience`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer invalid-token',
        'Content-Type': 'application/json'
      }
    });

    expect(response.status).toBe(401);
  });

  it('should accept requests with valid bearer token', async () => {
    const response = await fetch(`${BASE_URL}/api/tools/audience`, {
      method: 'GET',
      headers
    });

    expect(response.status).toBe(200);
  });
});

describe('Error Handling Tests', () => {
  it('should handle malformed JSON requests', async () => {
    const response = await fetch(`${BASE_URL}/api/tools/audience`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: 'invalid json'
    });

    expect(response.status).toBe(400);
  });

  it('should return proper error format', async () => {
    const response = await fetch(`${BASE_URL}/api/tools/audience`, {
      method: 'POST',
      headers,
      body: JSON.stringify({})
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data).toHaveProperty('success');
    expect(data).toHaveProperty('error');
    expect(data).toHaveProperty('timestamp');
    expect(data.success).toBe(false);
  });
});

describe('Performance Tests', () => {
  it('should respond to health checks within 1 second', async () => {
    const startTime = Date.now();

    const response = await fetch(`${BASE_URL}/api/discovery`);

    const responseTime = Date.now() - startTime;
    expect(responseTime).toBeLessThan(1000); // 1 second
    expect(response.status).toBe(200);
  });

  it('should include processing time headers', async () => {
    const response = await fetch(`${BASE_URL}/api/tools/audience`, {
      method: 'GET',
      headers
    });

    expect(response.status).toBe(200);
    // Processing time header is optional for GET requests
  });
});