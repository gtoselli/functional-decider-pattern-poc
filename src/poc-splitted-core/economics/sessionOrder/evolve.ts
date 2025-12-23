import type { Event, State } from './types';

export function evolve(state: State, event: Event): State {
  switch (event.type) {
    case 'SESSION_ORDER_PLACED': {
      return {
        id: event.data.id,
        status: 'quoted',
        patientId: event.data.patientId,
        placedAt: event.data.placedAt,
        voidedAt: null,
        reason: event.data.reason,
        cost: event.data.cost,
      };
    }
    case 'SESSION_ORDER_VOIDED': {
      if (state.status !== 'quoted') return state;
      return {
        ...state,
        voidedAt: event.data.voidedAt,
      };
    }
    default: {
      const _exhaustive: never = event;
      return _exhaustive;
    }
  }
}
