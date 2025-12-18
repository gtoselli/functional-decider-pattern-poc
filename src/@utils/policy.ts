import type { Event } from './decider';

// Policy - automatic reaction to events
export type Policy<Aggregates, Events extends Event = Event> = {
  when: Events['type'];
  then: (event: Events, aggregates: Aggregates) => Events[];
};

// Global policy registry
const GLOBAL_POLICIES: Policy<any, any>[] = [];

// Register a policy globally
export function registerPolicy<Aggregates, Events extends Event = Event>(
  policy: Policy<Aggregates, Events>,
): void {
  GLOBAL_POLICIES.push(policy);
}

// Clear all policies (useful for testing)
export function clearPolicies(): void {
  GLOBAL_POLICIES.length = 0;
}

// Apply policies to an event
export function applyPolicies<Aggregates, Events extends Event = Event>(
  event: Events,
  aggregates: Aggregates,
): Events[] {
  const matchingPolicies = GLOBAL_POLICIES.filter((p) => p.when === event.type);
  return matchingPolicies.flatMap((policy) => policy.then(event, aggregates));
}
