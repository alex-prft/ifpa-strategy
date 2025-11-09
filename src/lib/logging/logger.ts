/**
 * Structured Logging Infrastructure for OSA
 *
 * Provides centralized, structured logging with correlation IDs, metrics, and observability
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogContext {
  requestId?: string;
  correlationId?: string;
  userId?: string;
  sessionId?: string;
  service?: string;
  traceId?: string;
  spanId?: string;
  [key: string]: any;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  service: string;
  context: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
  metrics?: {
    duration?: number;
    memoryUsage?: number;
    cpuUsage?: number;
  };
  tags?: string[];
}

export interface LoggerConfig {
  level: LogLevel;
  service: string;
  environment?: string;
  enableConsole?: boolean;
  enableFile?: boolean;
  enableRemote?: boolean;
  remoteEndpoint?: string;
  contextFields?: string[];
}

export class Logger {
  private config: Required<LoggerConfig>;
  private context: LogContext = {};

  private static readonly LOG_LEVELS = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    fatal: 4
  };

  constructor(service: string, config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: 'info',
      service,
      environment: process.env.NODE_ENV || 'development',
      enableConsole: true,
      enableFile: false,
      enableRemote: false,
      remoteEndpoint: '',
      contextFields: ['requestId', 'correlationId', 'userId', 'sessionId'],
      ...config
    };
  }

  /**
   * Set persistent context for all log entries
   */
  setContext(context: LogContext): void {
    this.context = { ...this.context, ...context };
  }

  /**
   * Clear context
   */
  clearContext(): void {
    this.context = {};
  }

  /**
   * Create a child logger with additional context
   */
  child(context: LogContext): Logger {
    const childLogger = new Logger(this.config.service, this.config);
    childLogger.setContext({ ...this.context, ...context });
    return childLogger;
  }

  /**
   * Debug level logging
   */
  debug(message: string, context: LogContext = {}): void {
    this.log('debug', message, context);
  }

  /**
   * Info level logging
   */
  info(message: string, context: LogContext = {}): void {
    this.log('info', message, context);
  }

  /**
   * Warning level logging
   */
  warn(message: string, context: LogContext = {}): void {
    this.log('warn', message, context);
  }

  /**
   * Error level logging
   */
  error(message: string, context: LogContext = {}, error?: Error): void {
    const errorContext = error ? {
      ...context,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: (error as any).code
      }
    } : context;

    this.log('error', message, errorContext);
  }

  /**
   * Fatal level logging
   */
  fatal(message: string, context: LogContext = {}, error?: Error): void {
    const errorContext = error ? {
      ...context,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: (error as any).code
      }
    } : context;

    this.log('fatal', message, errorContext);
  }

  /**
   * Log with performance metrics
   */
  logWithMetrics(
    level: LogLevel,
    message: string,
    context: LogContext = {},
    metrics: {
      duration?: number;
      memoryUsage?: number;
      cpuUsage?: number;
    } = {}
  ): void {
    const memUsage = process.memoryUsage();
    const enhancedMetrics = {
      memoryUsage: memUsage.heapUsed,
      ...metrics
    };

    this.log(level, message, { ...context, metrics: enhancedMetrics });
  }

  /**
   * Log HTTP request
   */
  logRequest(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    context: LogContext = {}
  ): void {
    this.info(`${method} ${url} ${statusCode}`, {
      ...context,
      http: {
        method,
        url,
        statusCode,
        duration
      },
      metrics: {
        duration
      }
    });
  }

  /**
   * Log database operation
   */
  logDatabaseOperation(
    operation: string,
    table: string,
    duration: number,
    context: LogContext = {}
  ): void {
    this.debug(`Database ${operation} on ${table}`, {
      ...context,
      database: {
        operation,
        table,
        duration
      },
      metrics: {
        duration
      }
    });
  }

  /**
   * Log external API call
   */
  logExternalAPI(
    service: string,
    endpoint: string,
    method: string,
    statusCode: number,
    duration: number,
    context: LogContext = {}
  ): void {
    this.info(`External API call to ${service}`, {
      ...context,
      externalAPI: {
        service,
        endpoint,
        method,
        statusCode,
        duration
      },
      metrics: {
        duration
      }
    });
  }

  /**
   * Core logging method
   */
  private log(level: LogLevel, message: string, context: LogContext = {}): void {
    // Check if log level is enabled
    if (Logger.LOG_LEVELS[level] < Logger.LOG_LEVELS[this.config.level]) {
      return;
    }

    const timestamp = new Date().toISOString();
    const mergedContext = { ...this.context, ...context };

    const logEntry: LogEntry = {
      timestamp,
      level,
      message,
      service: this.config.service,
      context: mergedContext
    };

    // Add error information if present
    if (context.error) {
      logEntry.error = context.error as LogEntry['error'];
    }

    // Add metrics if present
    if (context.metrics) {
      logEntry.metrics = context.metrics as LogEntry['metrics'];
    }

    // Output to different targets
    if (this.config.enableConsole) {
      this.outputToConsole(logEntry);
    }

    if (this.config.enableFile) {
      this.outputToFile(logEntry);
    }

    if (this.config.enableRemote) {
      this.outputToRemote(logEntry);
    }
  }

  /**
   * Output to console with colors and formatting
   */
  private outputToConsole(entry: LogEntry): void {
    const colors = {
      debug: '\x1b[36m', // Cyan
      info: '\x1b[32m',  // Green
      warn: '\x1b[33m',  // Yellow
      error: '\x1b[31m', // Red
      fatal: '\x1b[35m'  // Magenta
    };

    const reset = '\x1b[0m';
    const color = colors[entry.level];

    const prefix = `${color}[${entry.timestamp}] ${entry.level.toUpperCase()} [${entry.service}]${reset}`;
    const contextStr = Object.keys(entry.context).length > 0
      ? ` | ${JSON.stringify(entry.context)}`
      : '';

    console.log(`${prefix} ${entry.message}${contextStr}`);

    if (entry.error?.stack) {
      console.error(entry.error.stack);
    }
  }

  /**
   * Output to file (placeholder for file logging implementation)
   */
  private outputToFile(entry: LogEntry): void {
    // In production, this would write to a log file or log aggregation service
    // For now, we'll just store in memory or skip
  }

  /**
   * Output to remote logging service
   */
  private async outputToRemote(entry: LogEntry): Promise<void> {
    if (!this.config.remoteEndpoint) return;

    try {
      await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(entry)
      });
    } catch (error) {
      // Fallback to console if remote logging fails
      console.error('Failed to send log to remote endpoint:', error);
    }
  }
}

/**
 * Request logger middleware for Next.js API routes
 */
export function requestLogger(
  req: any,
  res: any,
  logger: Logger
): { startTime: number; log: (message: string, context?: LogContext) => void } {
  const startTime = Date.now();
  const requestId = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const correlationId = req.headers['x-correlation-id'];

  const requestContext: LogContext = {
    requestId,
    correlationId,
    method: req.method,
    url: req.url,
    userAgent: req.headers['user-agent'],
    ip: req.ip || req.connection?.remoteAddress
  };

  logger.setContext(requestContext);

  logger.info(`Incoming ${req.method} ${req.url}`, {
    headers: req.headers
  });

  // Log response when it finishes
  const originalEnd = res.end;
  res.end = function(...args: any[]) {
    const duration = Date.now() - startTime;
    logger.logRequest(req.method, req.url, res.statusCode, duration);
    originalEnd.apply(res, args);
  };

  return {
    startTime,
    log: (message: string, context: LogContext = {}) => {
      logger.info(message, context);
    }
  };
}

/**
 * Performance measurement decorator
 */
export function LogPerformance(logger: Logger, operation: string) {
  return function(target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function(...args: any[]) {
      const startTime = Date.now();
      const operationId = `${operation}_${Date.now()}`;

      logger.debug(`Starting ${operation}`, { operationId });

      try {
        const result = await method.apply(this, args);
        const duration = Date.now() - startTime;

        logger.logWithMetrics('info', `Completed ${operation}`,
          { operationId },
          { duration }
        );

        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        logger.error(`Failed ${operation}`,
          { operationId, duration },
          error as Error
        );
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Global logger instances for different services
 */
export const loggers = {
  gateway: new Logger('api-gateway', { level: 'info' }),
  orchestration: new Logger('orchestration-service', { level: 'info' }),
  intake: new Logger('intake-service', { level: 'info' }),
  recommendations: new Logger('recommendation-service', { level: 'info' }),
  knowledge: new Logger('knowledge-service', { level: 'info' }),
  preferences: new Logger('preferences-service', { level: 'info' }),
  analytics: new Logger('analytics-service', { level: 'info' }),
  events: new Logger('event-bus', { level: 'info' }),
  monitoring: new Logger('monitoring-service', { level: 'info' })
};

/**
 * Create service-specific logger
 */
export function createServiceLogger(
  serviceName: string,
  config: Partial<LoggerConfig> = {}
): Logger {
  return new Logger(serviceName, {
    level: process.env.LOG_LEVEL as LogLevel || 'info',
    environment: process.env.NODE_ENV || 'development',
    enableConsole: true,
    enableRemote: !!process.env.REMOTE_LOG_ENDPOINT,
    remoteEndpoint: process.env.REMOTE_LOG_ENDPOINT,
    ...config
  });
}

/**
 * Global utility functions
 */
export const log = {
  debug: (message: string, context?: LogContext) => loggers.gateway.debug(message, context),
  info: (message: string, context?: LogContext) => loggers.gateway.info(message, context),
  warn: (message: string, context?: LogContext) => loggers.gateway.warn(message, context),
  error: (message: string, context?: LogContext, error?: Error) => loggers.gateway.error(message, context, error),
  fatal: (message: string, context?: LogContext, error?: Error) => loggers.gateway.fatal(message, context, error)
};

export default Logger;