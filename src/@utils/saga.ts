import type { Event } from './decider';

// Context holds all events produced so far
export type SagaContext<Events extends Event = Event> = {
  events: Events[];
};

// Saga step - a function that runs commands and returns events
export type SagaStep<Aggregates, Params, Events extends Event = Event> = (
  context: SagaContext<Events>,
  aggregates: Aggregates,
  params: Params,
) => Events[];

// Result of running a saga
export type SagaResult<Events extends Event = Event> =
  | { success: true; events: Events[] }
  | { success: false; error: string; events: Events[] };

// Saga executor
export function executeSaga<Aggregates, Params, Events extends Event = Event>(
  steps: SagaStep<Aggregates, Params, Events>[],
  aggregates: Aggregates,
  params: Params,
): SagaResult<Events> {
  const context: SagaContext<Events> = {
    events: [],
  };

  try {
    for (const step of steps) {
      const producedEvents = step(context, aggregates, params);
      context.events.push(...producedEvents);
    }

    return {
      success: true,
      events: context.events,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      events: context.events,
    };
  }
}

export function findEventByType<E extends Event, T extends E['type']>(
  context: SagaContext<E>,
  eventType: T,
): Extract<E, { type: T }> | undefined {
  return context.events.find((e) => e.type === eventType) as Extract<E, { type: T }> | undefined;
}

export function requireEvent<E extends Event, T extends E['type']>(
  context: SagaContext<E>,
  eventType: T,
): Extract<E, { type: T }> {
  const event = context.events.find((e) => e.type === eventType);
  if (!event) {
    throw new Error(`Required event '${eventType}' not found in saga context`);
  }
  return event as Extract<E, { type: T }>;
}

export function getLastEventByType<E extends Event, T extends E['type']>(
  context: SagaContext<E>,
  eventType: T,
): Extract<E, { type: T }> | undefined {
  const events = context.events.filter((e) => e.type === eventType);
  return events[events.length - 1] as Extract<E, { type: T }> | undefined;
}

export function getAllEventsByType<E extends Event, T extends E['type']>(
  context: SagaContext<E>,
  eventType: T,
): Extract<E, { type: T }>[] {
  return context.events.filter((e) => e.type === eventType) as Extract<E, { type: T }>[];
}
