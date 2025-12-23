import type { Event, State } from './types';

export function evolve(state: State, event: Event): State {
  switch (event.type) {
    case 'SERVICE_QUOTED': {
      return state;
    }
    case 'QUOTE_RELEASED':
      return state;
    default: {
      const _exhaustive: never = event;
      return _exhaustive;
    }
  }
}
