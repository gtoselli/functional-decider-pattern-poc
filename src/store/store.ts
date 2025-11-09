import Redis from 'ioredis';
import type { State } from '../decider-approach/types';
import type { Store } from './types';

export function SimpleStore() {
  const redis = new Redis();

  return {
    async save(state: State): Promise<void> {
      await redis.set(state.id, JSON.stringify(state));
    },
    async getById(id: string): Promise<State | null> {
      const data = await redis.get(id);
      if (!data) return null;
      return JSON.parse(data) as State;
    },
    async purge(key: string) {
      await redis.del(key);
    },
  } satisfies Store<State>;
}
