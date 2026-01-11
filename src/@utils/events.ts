export function getEvent<E extends Event, T extends E['type']>(events: E[], eventType: T): Extract<E, { type: T }> {
  const event = events.find((e) => e.type === eventType);
  if (!event) throw new Error(`Event not found`);

  return event as Extract<E, { type: T }>;
}

interface Event<
  EventType extends string = string,
  EventData extends Record<string, unknown> = Record<string, unknown>,
> {
  type: EventType;
  data: EventData;
}
