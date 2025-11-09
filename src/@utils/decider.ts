export interface Decider<State, CommandType extends Command, EventType extends Event> {
  decide: (command: CommandType, state: State) => EventType[];
  evolve: (currentState: State, event: EventType) => State;
}

interface Event<
  EventType extends string = string,
  EventData extends Record<string, unknown> = Record<string, unknown>,
> {
  type: EventType;
  data: EventData;
}

interface Command<
  CommandType extends string = string,
  CommandData extends Record<string, unknown> = Record<string, unknown>,
> {
  type: CommandType;
  data: CommandData;
}

export function createDeciderRunner<State, CommandType extends Command, EventType extends Event>(
  decider: Decider<State, CommandType, EventType>,
  initialState: State,
) {
  let currentState = initialState;

  return {
    getState() {
      return currentState;
    },
    reset() {
      currentState = initialState;
    },
    run(command: CommandType): EventType[] {
      const events = decider.decide(command, currentState);
      currentState = events.reduce(decider.evolve, currentState);
      return events;
    },
  };
}
