// File-Based Storage for Webhook Events
// Fallback storage when database is unavailable
// Uses JSON files with 30-day retention and rotation

import { promises as fs } from 'fs';
import path from 'path';
import type { WebhookEvent, WebhookEventQuery } from './webhook-events';

export class FileBasedStorage {
  private readonly dataDir: string;
  private readonly retentionDays: number;

  constructor(dataDir: string = 'data/webhook-events', retentionDays: number = 30) {
    this.dataDir = dataDir;
    this.retentionDays = retentionDays;
  }

  /**
   * Ensure data directory exists
   */
  private async ensureDataDir(): Promise<void> {
    try {
      await fs.access(this.dataDir);
    } catch {
      await fs.mkdir(this.dataDir, { recursive: true });
    }
  }

  /**
   * Get file path for a date
   */
  private getFilePath(date: Date): string {
    const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD
    return path.join(this.dataDir, `webhook-events-${dateString}.json`);
  }

  /**
   * Load events from a file
   */
  private async loadEventsFromFile(filePath: string): Promise<WebhookEvent[]> {
    try {
      await fs.access(filePath);
      const content = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(content);
      return Array.isArray(data.events) ? data.events : [];
    } catch {
      return [];
    }
  }

  /**
   * Save events to a file
   */
  private async saveEventsToFile(filePath: string, events: WebhookEvent[]): Promise<void> {
    const data = {
      created_at: new Date().toISOString(),
      last_updated: new Date().toISOString(),
      events: events,
      count: events.length
    };
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  }

  /**
   * Store a webhook event
   */
  async storeWebhookEvent(event: WebhookEvent): Promise<string> {
    try {
      await this.ensureDataDir();

      const eventId = `file-webhook-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const eventWithId = {
        ...event,
        id: eventId,
        received_at: event.received_at || new Date().toISOString()
      };

      const eventDate = new Date(eventWithId.received_at!);
      const filePath = this.getFilePath(eventDate);

      // Load existing events for the day
      const existingEvents = await this.loadEventsFromFile(filePath);

      // Add new event
      existingEvents.push(eventWithId);

      // Sort by received_at (newest first)
      existingEvents.sort((a, b) =>
        new Date(b.received_at!).getTime() - new Date(a.received_at!).getTime()
      );

      // Save back to file
      await this.saveEventsToFile(filePath, existingEvents);

      // Cleanup old files in background
      this.cleanupOldEvents().catch(err =>
        console.warn('File cleanup failed:', err.message)
      );

      return eventId;
    } catch (error) {
      console.error('Failed to store webhook event to file:', error);
      return `file-error-${Date.now()}`;
    }
  }

  /**
   * Get webhook events with filtering
   */
  async getWebhookEvents(query: WebhookEventQuery = {}): Promise<WebhookEvent[]> {
    try {
      await this.ensureDataDir();

      const endDate = query.end_date ? new Date(query.end_date) : new Date();
      const startDate = query.start_date ? new Date(query.start_date) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const allEvents: WebhookEvent[] = [];

      // Iterate through date range and load files
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const filePath = this.getFilePath(currentDate);
        const events = await this.loadEventsFromFile(filePath);
        allEvents.push(...events);
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Apply filters
      let filteredEvents = allEvents;

      if (query.event_type) {
        filteredEvents = filteredEvents.filter(e => e.event_type === query.event_type);
      }

      if (query.workflow_id) {
        filteredEvents = filteredEvents.filter(e => e.workflow_id === query.workflow_id);
      }

      if (query.session_id) {
        filteredEvents = filteredEvents.filter(e => e.session_id === query.session_id);
      }

      if (query.success !== undefined) {
        filteredEvents = filteredEvents.filter(e => e.success === query.success);
      }

      if (query.start_date) {
        filteredEvents = filteredEvents.filter(e =>
          e.received_at && e.received_at >= query.start_date!
        );
      }

      if (query.end_date) {
        filteredEvents = filteredEvents.filter(e =>
          e.received_at && e.received_at <= query.end_date!
        );
      }

      // Sort by received_at (newest first)
      filteredEvents.sort((a, b) =>
        new Date(b.received_at!).getTime() - new Date(a.received_at!).getTime()
      );

      // Apply pagination
      const offset = query.offset || 0;
      const limit = query.limit || 50;

      return filteredEvents.slice(offset, offset + limit);
    } catch (error) {
      console.error('Failed to get webhook events from files:', error);
      return [];
    }
  }

  /**
   * Get latest webhook event for a session
   */
  async getLatestWebhookForSession(sessionId: string): Promise<WebhookEvent | null> {
    try {
      const events = await this.getWebhookEvents({
        session_id: sessionId,
        limit: 1
      });
      return events.length > 0 ? events[0] : null;
    } catch (error) {
      console.error('Failed to get latest webhook for session from files:', error);
      return null;
    }
  }

  /**
   * Get webhook statistics
   */
  async getWebhookStats(hours: number = 24): Promise<{
    total_events: number;
    success_rate: number;
    failed_events: number;
    avg_processing_time: number;
    event_types: Record<string, number>;
  }> {
    try {
      const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
      const events = await this.getWebhookEvents({
        start_date: since,
        limit: 10000 // Large limit to get all events in timeframe
      });

      const total_events = events.length;
      const successful_events = events.filter(e => e.success).length;
      const failed_events = total_events - successful_events;
      const success_rate = total_events > 0 ? (successful_events / total_events) * 100 : 0;

      // Calculate average processing time
      const processingTimes = events
        .filter(e => e.processing_time_ms)
        .map(e => e.processing_time_ms!);
      const avg_processing_time = processingTimes.length > 0
        ? processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length
        : 0;

      // Count event types
      const event_types: Record<string, number> = {};
      events.forEach(event => {
        event_types[event.event_type] = (event_types[event.event_type] || 0) + 1;
      });

      return {
        total_events,
        success_rate,
        failed_events,
        avg_processing_time,
        event_types
      };
    } catch (error) {
      console.error('Failed to get webhook stats from files:', error);
      return {
        total_events: 0,
        success_rate: 100,
        failed_events: 0,
        avg_processing_time: 0,
        event_types: {}
      };
    }
  }

  /**
   * Get webhook status for dashboard
   */
  async getWebhookStatus(): Promise<{
    last_webhook_received: string | null;
    webhook_health: 'healthy' | 'warning' | 'error';
    recent_failures: number;
    connection_status: 'connected' | 'disconnected' | 'error';
  }> {
    try {
      // Get recent events (last hour)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const recentEvents = await this.getWebhookEvents({
        start_date: oneHourAgo,
        limit: 1000
      });

      const recent_failures = recentEvents.filter(e => !e.success).length;
      const latest = recentEvents.length > 0 ? recentEvents[0] : null;

      // Determine health status
      let webhook_health: 'healthy' | 'warning' | 'error' = 'healthy';
      let connection_status: 'connected' | 'disconnected' | 'error' = 'connected';

      if (!latest) {
        webhook_health = 'error';
        connection_status = 'disconnected';
      } else {
        const lastReceived = new Date(latest.received_at!);
        const hoursSinceLastWebhook = (Date.now() - lastReceived.getTime()) / (1000 * 60 * 60);

        if (hoursSinceLastWebhook > 24) {
          webhook_health = 'error';
          connection_status = 'disconnected';
        } else if (hoursSinceLastWebhook > 2 || (recentEvents.length > 0 && recent_failures / recentEvents.length > 0.5)) {
          webhook_health = 'warning';
          connection_status = 'error';
        }
      }

      return {
        last_webhook_received: latest?.received_at || null,
        webhook_health,
        recent_failures,
        connection_status
      };
    } catch (error) {
      console.error('Failed to get webhook status from files:', error);
      return {
        last_webhook_received: null,
        webhook_health: 'error',
        recent_failures: 0,
        connection_status: 'disconnected'
      };
    }
  }

  /**
   * Clean up old event files (retention policy)
   */
  async cleanupOldEvents(retentionDays: number = this.retentionDays): Promise<number> {
    try {
      await this.ensureDataDir();

      const files = await fs.readdir(this.dataDir);
      const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
      let deletedCount = 0;

      for (const file of files) {
        if (file.startsWith('webhook-events-') && file.endsWith('.json')) {
          // Extract date from filename: webhook-events-YYYY-MM-DD.json
          const dateMatch = file.match(/webhook-events-(\d{4}-\d{2}-\d{2})\.json/);
          if (dateMatch) {
            const fileDate = new Date(dateMatch[1]);
            if (fileDate < cutoffDate) {
              const filePath = path.join(this.dataDir, file);
              await fs.unlink(filePath);
              deletedCount++;
            }
          }
        }
      }

      if (deletedCount > 0) {
        console.log(`File storage: Cleaned up ${deletedCount} webhook event files older than ${retentionDays} days`);
      }

      return deletedCount;
    } catch (error) {
      console.error('Failed to cleanup old webhook event files:', error);
      return 0;
    }
  }

  /**
   * Get storage info and statistics
   */
  async getStorageInfo(): Promise<{
    storage_type: 'file';
    total_files: number;
    oldest_file: string | null;
    newest_file: string | null;
    total_events: number;
  }> {
    try {
      await this.ensureDataDir();

      const files = await fs.readdir(this.dataDir);
      const eventFiles = files.filter(f => f.startsWith('webhook-events-') && f.endsWith('.json'));

      let total_events = 0;
      let oldest_file: string | null = null;
      let newest_file: string | null = null;

      for (const file of eventFiles) {
        const filePath = path.join(this.dataDir, file);
        const events = await this.loadEventsFromFile(filePath);
        total_events += events.length;

        // Track oldest and newest files
        const dateMatch = file.match(/webhook-events-(\d{4}-\d{2}-\d{2})\.json/);
        if (dateMatch) {
          const fileDate = dateMatch[1];
          if (!oldest_file || fileDate < oldest_file.split('-').slice(-3).join('-')) {
            oldest_file = file;
          }
          if (!newest_file || fileDate > newest_file.split('-').slice(-3).join('-')) {
            newest_file = file;
          }
        }
      }

      return {
        storage_type: 'file',
        total_files: eventFiles.length,
        oldest_file,
        newest_file,
        total_events
      };
    } catch (error) {
      console.error('Failed to get storage info:', error);
      return {
        storage_type: 'file',
        total_files: 0,
        oldest_file: null,
        newest_file: null,
        total_events: 0
      };
    }
  }
}

// Export singleton instance
export const fileBasedStorage = new FileBasedStorage();