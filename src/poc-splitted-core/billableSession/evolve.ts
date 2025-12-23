import type { Event, State } from './types';

export function evolve(state: State, event: Event): State {
  switch (event.type) {
    case 'BILLABLE_SESSION_PRICED': {
      return {
        id: event.data.id,
        status: 'priced',
        patientId: event.data.patientId,
        pricedAt: event.data.pricedAt,
        releasedAt: null,
        repricedAt: null,
        reason: event.data.reason,
        cost: event.data.cost,
      };
    }
    case 'BILLABLE_SESSION_REPRICED': {
      if (state.status !== 'priced') return state;
      return {
        ...state,
        repricedAt: event.data.repricedAt,
        reason: event.data.reason,
        cost: event.data.cost,
      };
    }
    case 'BILLABLE_SESSION_RELEASED': {
      if (state.status !== 'priced') return state;
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
