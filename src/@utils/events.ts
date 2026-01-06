import type { Event } from './decider';

export function getEvent<E extends Event, T extends E['type']>(events: E[], eventType: T): Extract<E, { type: T }> {
  const event = events.find((e) => e.type === eventType);
  if (!event) {
    throw new Error(`Event not found`);
  }
  return event as Extract<E, { type: T }>;
}

export function getEvents<E extends Event, T extends E['type']>(events: E[], eventType: T): Extract<E, { type: T }>[] {
  return events.filter((e) => e.type === eventType) as Extract<E, { type: T }>[];
}
