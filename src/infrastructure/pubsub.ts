type Listener<T> = (data: T) => void;

class PubSub {
  private channels = new Map<string, Set<Listener<unknown>>>();

  subscribe<T>(channel: string, listener: Listener<T>): () => void {
    if (!this.channels.has(channel)) {
      this.channels.set(channel, new Set());
    }
    const listeners = this.channels.get(channel)!;
    listeners.add(listener as Listener<unknown>);

    // Return unsubscribe function
    return () => {
      listeners.delete(listener as Listener<unknown>);
      if (listeners.size === 0) {
        this.channels.delete(channel);
      }
    };
  }

  publish<T>(channel: string, data: T): void {
    const listeners = this.channels.get(channel);
    if (!listeners) return;
    for (const listener of listeners) {
      listener(data);
    }
  }

  subscriberCount(channel: string): number {
    return this.channels.get(channel)?.size ?? 0;
  }
}

// Singleton — survives HMR in development
const globalForPubSub = globalThis as unknown as { __pubsub?: PubSub };
export const pubsub = globalForPubSub.__pubsub ?? (globalForPubSub.__pubsub = new PubSub());
