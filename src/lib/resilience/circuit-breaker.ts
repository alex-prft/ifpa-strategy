/**
 * Circuit Breaker Implementation for OSA Services
 *
 * Provides automatic failure detection, isolation, and recovery for service calls
 */

export interface CircuitBreakerConfig {
  threshold: number; // Number of failures to trigger open state
  timeout: number; // Time in ms to wait before trying half-open
  resetTimeout?: number; // Time to wait in half-open before going to closed
  monitoringPeriod?: number; // Time window for failure tracking
  expectedErrors?: (error: Error) => boolean; // Function to determine if error should trip circuit
}

export type CircuitBreakerState = 'closed' | 'open' | 'half_open';

export interface CircuitBreakerStats {
  state: CircuitBreakerState;
  failureCount: number;
  successCount: number;
  totalRequests: number;
  lastFailureTime?: Date;
  lastSuccessTime?: Date;
  nextAttemptTime?: Date;
}

export class CircuitBreaker {
  private state: CircuitBreakerState = 'closed';
  private failureCount = 0;
  private successCount = 0;
  private totalRequests = 0;
  private lastFailureTime?: Date;
  private lastSuccessTime?: Date;
  private nextAttemptTime?: Date;
  private config: Required<CircuitBreakerConfig>;

  constructor(
    private name: string,
    config: CircuitBreakerConfig
  ) {
    this.config = {
      resetTimeout: 30000, // 30 seconds
      monitoringPeriod: 60000, // 1 minute
      expectedErrors: () => true, // All errors trip circuit by default
      ...config
    };
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (!this.canExecute()) {
      throw new Error(`Circuit breaker '${this.name}' is OPEN. Service is unavailable.`);
    }

    this.totalRequests++;

    try {
      const result = await fn();
      this.recordSuccess();
      return result;
    } catch (error) {
      if (this.config.expectedErrors(error as Error)) {
        this.recordFailure();
      }
      throw error;
    }
  }

  /**
   * Check if the circuit breaker allows execution
   */
  private canExecute(): boolean {
    switch (this.state) {
      case 'closed':
        return true;

      case 'open':
        if (this.nextAttemptTime && Date.now() >= this.nextAttemptTime.getTime()) {
          this.state = 'half_open';
          console.log(`🔌 [CircuitBreaker:${this.name}] Transitioning to HALF_OPEN for testing`);
          return true;
        }
        return false;

      case 'half_open':
        return true;

      default:
        return false;
    }
  }

  /**
   * Record a successful operation
   */
  recordSuccess(): void {
    this.successCount++;
    this.lastSuccessTime = new Date();

    if (this.state === 'half_open') {
      // If we're in half-open and got a success, close the circuit
      this.reset();
      console.log(`🔌 [CircuitBreaker:${this.name}] SUCCESS in HALF_OPEN, transitioning to CLOSED`);
    } else if (this.state === 'closed') {
      // Reset failure count on success in closed state
      this.failureCount = 0;
    }
  }

  /**
   * Record a failed operation
   */
  recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = new Date();

    if (this.state === 'half_open') {
      // If we fail in half-open, go back to open
      this.trip();
      console.log(`🔌 [CircuitBreaker:${this.name}] FAILURE in HALF_OPEN, transitioning back to OPEN`);
    } else if (this.state === 'closed' && this.failureCount >= this.config.threshold) {
      // If we hit the threshold in closed state, trip the circuit
      this.trip();
      console.log(`🔌 [CircuitBreaker:${this.name}] THRESHOLD REACHED (${this.failureCount}/${this.config.threshold}), transitioning to OPEN`);
    }
  }

  /**
   * Trip the circuit breaker (set to open state)
   */
  private trip(): void {
    this.state = 'open';
    this.nextAttemptTime = new Date(Date.now() + this.config.timeout);

    // Emit circuit breaker event
    this.emitStateChangeEvent('open');
  }

  /**
   * Reset the circuit breaker (set to closed state)
   */
  private reset(): void {
    this.state = 'closed';
    this.failureCount = 0;
    this.nextAttemptTime = undefined;

    // Emit circuit breaker event
    this.emitStateChangeEvent('closed');
  }

  /**
   * Force the circuit breaker to open state (for testing or manual intervention)
   */
  forceOpen(): void {
    this.state = 'open';
    this.nextAttemptTime = new Date(Date.now() + this.config.timeout);
    console.log(`🔌 [CircuitBreaker:${this.name}] Manually forced to OPEN state`);
    this.emitStateChangeEvent('open');
  }

  /**
   * Force the circuit breaker to closed state (for testing or manual intervention)
   */
  forceClosed(): void {
    this.reset();
    console.log(`🔌 [CircuitBreaker:${this.name}] Manually forced to CLOSED state`);
  }

  /**
   * Get current circuit breaker state
   */
  getState(): CircuitBreakerState {
    return this.state;
  }

  /**
   * Get comprehensive stats about the circuit breaker
   */
  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      totalRequests: this.totalRequests,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      nextAttemptTime: this.nextAttemptTime
    };
  }

  /**
   * Get failure rate as percentage
   */
  getFailureRate(): number {
    if (this.totalRequests === 0) return 0;
    return (this.failureCount / this.totalRequests) * 100;
  }

  /**
   * Check if the circuit breaker is healthy
   */
  isHealthy(): boolean {
    return this.state === 'closed' && this.getFailureRate() < 50;
  }

  /**
   * Emit state change events for monitoring
   */
  private emitStateChangeEvent(newState: CircuitBreakerState): void {
    // In a real implementation, this would publish to the event bus
    console.log(`🔌 [CircuitBreaker:${this.name}] State changed to: ${newState.toUpperCase()}`, {
      name: this.name,
      state: newState,
      failureCount: this.failureCount,
      threshold: this.config.threshold,
      nextAttemptTime: this.nextAttemptTime
    });
  }

  /**
   * Create a wrapper function with circuit breaker protection
   */
  wrap<TArgs extends any[], TReturn>(
    fn: (...args: TArgs) => Promise<TReturn>
  ): (...args: TArgs) => Promise<TReturn> {
    return async (...args: TArgs): Promise<TReturn> => {
      return this.execute(() => fn(...args));
    };
  }
}

/**
 * Circuit Breaker Manager - manages multiple circuit breakers
 */
export class CircuitBreakerManager {
  private breakers = new Map<string, CircuitBreaker>();

  /**
   * Get or create a circuit breaker
   */
  getBreaker(name: string, config?: CircuitBreakerConfig): CircuitBreaker {
    if (!this.breakers.has(name)) {
      const defaultConfig: CircuitBreakerConfig = {
        threshold: 5,
        timeout: 60000, // 1 minute
        resetTimeout: 30000, // 30 seconds
        monitoringPeriod: 60000 // 1 minute
      };

      this.breakers.set(name, new CircuitBreaker(name, config || defaultConfig));
    }

    return this.breakers.get(name)!;
  }

  /**
   * Get all circuit breakers
   */
  getAllBreakers(): Map<string, CircuitBreaker> {
    return new Map(this.breakers);
  }

  /**
   * Get health summary of all circuit breakers
   */
  getHealthSummary(): {
    total: number;
    healthy: number;
    degraded: number;
    failed: number;
    breakers: Array<{
      name: string;
      state: CircuitBreakerState;
      failureRate: number;
      healthy: boolean;
    }>;
  } {
    const summary = {
      total: this.breakers.size,
      healthy: 0,
      degraded: 0,
      failed: 0,
      breakers: [] as Array<{
        name: string;
        state: CircuitBreakerState;
        failureRate: number;
        healthy: boolean;
      }>
    };

    for (const [name, breaker] of this.breakers) {
      const stats = breaker.getStats();
      const failureRate = breaker.getFailureRate();
      const healthy = breaker.isHealthy();

      summary.breakers.push({
        name,
        state: stats.state,
        failureRate,
        healthy
      });

      if (healthy) {
        summary.healthy++;
      } else if (stats.state === 'half_open') {
        summary.degraded++;
      } else {
        summary.failed++;
      }
    }

    return summary;
  }

  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    for (const breaker of this.breakers.values()) {
      breaker.forceClosed();
    }
  }

  /**
   * Remove a circuit breaker
   */
  removeBreaker(name: string): boolean {
    return this.breakers.delete(name);
  }
}

// Global circuit breaker manager instance
export const circuitBreakerManager = new CircuitBreakerManager();

// Predefined circuit breakers for OSA services
export const OSA_CIRCUIT_BREAKERS = {
  // OPAL API calls
  OPAL_API: {
    threshold: 5,
    timeout: 120000, // 2 minutes
    resetTimeout: 60000 // 1 minute
  },

  // Supabase database operations
  DATABASE: {
    threshold: 3,
    timeout: 30000, // 30 seconds
    resetTimeout: 15000 // 15 seconds
  },

  // External API calls
  EXTERNAL_API: {
    threshold: 5,
    timeout: 60000, // 1 minute
    resetTimeout: 30000 // 30 seconds
  },

  // AI/ML service calls
  AI_SERVICE: {
    threshold: 3,
    timeout: 180000, // 3 minutes
    resetTimeout: 60000 // 1 minute
  }
} as const;

/**
 * Utility function to create service-specific circuit breakers
 */
export function createServiceCircuitBreaker(
  serviceName: string,
  operationType: 'api' | 'database' | 'external' | 'ai' = 'api'
): CircuitBreaker {
  const configMap = {
    api: OSA_CIRCUIT_BREAKERS.EXTERNAL_API,
    database: OSA_CIRCUIT_BREAKERS.DATABASE,
    external: OSA_CIRCUIT_BREAKERS.EXTERNAL_API,
    ai: OSA_CIRCUIT_BREAKERS.AI_SERVICE
  };

  const config = configMap[operationType];
  const breakerName = `${serviceName}-${operationType}`;

  return circuitBreakerManager.getBreaker(breakerName, config);
}

/**
 * Decorator for automatic circuit breaker protection
 */
export function WithCircuitBreaker(
  breakerName: string,
  config?: CircuitBreakerConfig
) {
  return function(target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const breaker = circuitBreakerManager.getBreaker(breakerName, config);

    descriptor.value = async function(...args: any[]) {
      return breaker.execute(() => method.apply(this, args));
    };

    return descriptor;
  };
}