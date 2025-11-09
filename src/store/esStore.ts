import Redis from 'ioredis';
import type { Event } from '../decider-approach/types';
import type { ESStore } from './types';

export function EsStore() {
  const redis = new Redis();

  return {
    async append(key: string, events: Event[]): Promise<void> {
      const pipeline = redis.pipeline();
      for (const event of events) {
        pipeline.xadd(key, '*', 'event', JSON.stringify(event));
      }
      await pipeline.exec();
    },
    async load(key: string): Promise<Event[]> {
      const entries = await redis.xrange(key, '0', '+');

      return entries.map(([, fields]) => {
        return JSON.parse(fields[1]) as Event;
      });
    },
    async purge(key: string) {
      await redis.del(key);
    },
  } satisfies ESStore<Event>;
}
