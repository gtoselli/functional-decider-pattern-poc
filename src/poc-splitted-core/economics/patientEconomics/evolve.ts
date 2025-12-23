import type { Event, State } from './types';

export function evolve(state: State, event: Event): State {
  switch (event.type) {
    case 'SESSION_PRICED': {
      return state;
    }
    case 'SESSION_PRICE_VOIDED':
      return state;
    default: {
      const _exhaustive: never = event;
      return _exhaustive;
    }
  }
}
