import type { Event, State } from './types';

export function evolve(state: State, event: Event): State {
  switch (event.type) {
    case 'SESSION_QUOTE_PLACED': {
      return {
        id: event.data.id,
        status: 'quoted',
        patientId: event.data.patientId,
        pricedAt: event.data.pricedAt,
        releasedAt: null,
        repricedAt: null,
        reason: event.data.reason,
        cost: event.data.cost,
      };
    }
    case 'SESSION_QUOTE_REPLACED': {
      if (state.status !== 'quoted') return state;
      return {
        ...state,
        repricedAt: event.data.repricedAt,
        reason: event.data.reason,
        cost: event.data.cost,
      };
    }
    case 'SESSION_QUOTE_VOIDED': {
      if (state.status !== 'quoted') return state;
      return {
        ...state,
        releasedAt: event.data.releasedAt,
      };
    }
    default: {
      const _exhaustive: never = event;
      return _exhaustive;
    }
  }
}
