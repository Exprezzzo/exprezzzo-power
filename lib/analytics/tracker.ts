interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  timestamp: number;
  userId?: string;
  sessionId?: string;
}

class AnalyticsTracker {
  private queue: AnalyticsEvent[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  
  constructor() {
    // Start flush interval
    this.flushInterval = setInterval(() => this.flush(), 10000);
  }
  
  track(event: string, properties?: Record<string, any>) {
    const analyticsEvent: AnalyticsEvent = {
      event,
      properties,
      timestamp: Date.now(),
      sessionId: this.getSessionId(),
      userId: this.getUserId()
    };
    
    this.queue.push(analyticsEvent);
    
    // Flush if queue is getting large
    if (this.queue.length >= 20) {
      this.flush();
    }
  }
  
  async flush() {
    if (this.queue.length === 0) return;
    
    const events = [...this.queue];
    this.queue = [];
    
    try {
      await fetch('/api/analytics/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events })
      });
    } catch (error) {
      console.error('Failed to send analytics:', error);
      // Re-add events to queue
      this.queue.unshift(...events);
    }
  }
  
  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
  }
  
  private getUserId(): string | undefined {
    return localStorage.getItem('user_id') || undefined;
  }
  
  // Convenience methods
  pageView(page: string) {
    this.track('page_view', { page });
  }
  
  modelUsed(model: string, tokens: number, duration: number) {
    this.track('model_used', { model, tokens, duration });
  }
  
  error(error: string, context?: any) {
    this.track('error', { error, context });
  }
  
  conversion(type: string, value?: number) {
    this.track('conversion', { type, value });
  }
}

export const analytics = new AnalyticsTracker();