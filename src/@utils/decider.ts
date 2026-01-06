export interface Decider<State, CommandType extends Command, EventType extends Event> {
  decide: (command: CommandType, state: State) => EventType[];
  evolve: (currentState: State, event: EventType) => State;
}

export interface Event<
  EventType extends string = string,
  EventData extends Record<string, unknown> = Record<string, unknown>,
> {
  type: EventType;
  data: EventData;
}

export interface Command<
  CommandType extends string = string,
  CommandData extends Record<string, unknown> = Record<string, unknown>,
> {
  type: CommandType;
  data: CommandData;
}

export function createDeciderAggregate<State, CommandType extends Command, EventType extends Event>(
  decider: Decider<State, CommandType, EventType>,
  initialState: State,
) {
  let currentState = initialState;
  const uncommittedEvents: EventType[] = [];

  return {
    getEvents() {
      return uncommittedEvents;
    },
    getState() {
      return currentState;
    },
    resetToInitialState() {
      currentState = initialState;
      uncommittedEvents.length = 0;
    },
    run(command: CommandType): EventType[] {
      const events = decider.decide(command, currentState);
      currentState = events.reduce(decider.evolve, currentState);
      uncommittedEvents.push(...events);
      return events;
    },
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Aggregate<D extends Decider<any, any, any>> = D extends Decider<infer S, infer C, infer E>
  ? ReturnType<typeof createDeciderAggregate<S, C, E>>
  : never;
