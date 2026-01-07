import type { Event, State } from './types';

export function evolve(state: State, event: Event): State {
  switch (event.type) {
    case 'SESSION_PRICED': {
      return state;
    }
    case 'SESSION_PRICE_VOIDED':
      return state;
    case 'SUBSCRIPTION_STATUS_SET':
      return { ...state, subscription: { status: event.data.status } };
    default: {
      const _exhaustive: never = event;
      return _exhaustive;
    }
  }
}
