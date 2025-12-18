import type { Event } from './decider';

// Policy - automatic reaction to events
// Receives dependencies to get/save aggregates as needed
export type Policy<Dependencies, Events extends Event = Event> = {
  when: Events['type'];
  then: (event: Events, dependencies: Dependencies) => Events[];
};

// Global policy registry
const GLOBAL_POLICIES: Policy<any, any>[] = [];

// Register a policy globally
export function registerPolicy<Dependencies, Events extends Event = Event>(
  policy: Policy<Dependencies, Events>,
): void {
  GLOBAL_POLICIES.push(policy);
}

// Clear all policies (useful for testing)
export function clearPolicies(): void {
  GLOBAL_POLICIES.length = 0;
}

// Apply policies to an event
export function applyPolicies<Dependencies, Events extends Event = Event>(
  event: Events,
  dependencies: Dependencies,
): Events[] {
  const matchingPolicies = GLOBAL_POLICIES.filter((p) => p.when === event.type);
  return matchingPolicies.flatMap((policy) => policy.then(event, dependencies));
}
