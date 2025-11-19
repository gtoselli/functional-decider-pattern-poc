import type { Result } from 'neverthrow';
import { evolve } from '../decider-approach/evolve';
import type { Command, Event, State } from '../decider-approach/types';
import { decide } from './decide';

export interface DeciderWithResult<State, CommandType extends Command, EventType extends Event, ErrorType> {
  decide: (command: CommandType, state: State) => Result<EventType[], ErrorType>;
  evolve: (currentState: State, event: EventType) => State;
}

export const decider = { decide, evolve } satisfies DeciderWithResult<State, Command, Event, unknown>;

export function createDeciderWithResultRunner<State, CommandType extends Command, EventType extends Event, ErrorType>(
  decider: DeciderWithResult<State, CommandType, EventType, ErrorType>,
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
    run(command: CommandType): Result<EventType[], ErrorType> {
      const eventsResult = decider.decide(command, currentState);
      return eventsResult.map((events) => {
        currentState = events.reduce(decider.evolve, currentState);
        return events;
      });
    },
  };
}
