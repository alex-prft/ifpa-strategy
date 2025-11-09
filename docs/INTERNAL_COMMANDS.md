# Internal Commands Documentation

## OSA System Internal Commands

### Database & Rate Limiting Commands

#### `reset_opal`
**Purpose**: Reset the daily OPAL workflow rate limit (5 per day)
**Usage**: For administrative purposes when testing or when legitimate users need to exceed daily limits
**Implementation**: Clears daily workflow count from database

```bash
# Usage in admin panel or API
POST /api/opal/admin/reset-limit
Authorization: Bearer <admin-token>
```

**Effects**:
- Resets daily workflow counter to 0
- Allows new workflow submissions
- Logs reset action for audit trail

#### `force_sync`
**Purpose**: Override rate limiting for critical workflows
**Usage**: When admin needs to bypass daily limits for specific requests
**Implementation**: Uses `x-force-sync: true` header

```bash
# Usage in form submission
POST /api/osa/workflow
x-force-sync: true
Authorization: Bearer <token>
```

### Data Management Commands

#### `get_latest_data`
**Purpose**: Retrieve most recent OPAL workflow results for a client
**Usage**: When rate limited, show cached results instead of failing
**Implementation**: Query database for latest completed workflow

#### `cleanup_old_workflows`
**Purpose**: Remove workflows older than specified age (default: 24 hours)
**Usage**: Maintenance operation to keep database clean
**Implementation**: Automated cleanup with configurable retention period

### Health Check Commands

#### `health_check`
**Purpose**: Verify system health including database, APIs, and webhook endpoints
**Usage**: Monitoring and diagnostics
**Implementation**: Comprehensive system status check

#### `connection_pool_stats`
**Purpose**: Get database connection pool statistics
**Usage**: Performance monitoring and optimization
**Implementation**: Returns active/idle connection counts and health status

### Security Commands

#### `validate_webhook_auth`
**Purpose**: Test webhook authentication configuration
**Usage**: Verify HMAC signatures and bearer tokens are working correctly
**Implementation**: End-to-end authentication validation

#### `rotate_api_keys`
**Purpose**: Generate new API keys and update environment configuration
**Usage**: Security maintenance and incident response
**Implementation**: Secure key generation with rollover support

## Command Access Levels

- **Public**: Available through standard API endpoints
- **Admin**: Require admin authentication and elevated permissions
- **Internal**: System-level commands for maintenance and debugging

## Error Handling

All commands implement:
- Comprehensive error logging
- Graceful failure modes
- Audit trail creation
- Performance monitoring
- Circuit breaker protection

## Usage Examples

### Resetting Daily Rate Limit
```javascript
// Admin panel usage
await fetch('/api/opal/admin/reset-limit', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer admin-token',
    'Content-Type': 'application/json'
  }
});
```

### Graceful Degradation on Rate Limit
```javascript
// Form submission with fallback
try {
  const result = await submitOSAWorkflow(formData);
  return result;
} catch (error) {
  if (error.status === 429) {
    // Rate limited - use latest cached data
    const cachedResult = await getLatestWorkflowData(formData.client_name);
    return {
      ...cachedResult,
      isFromCache: true,
      message: 'Showing latest available results (daily limit reached)'
    };
  }
  throw error;
}
```