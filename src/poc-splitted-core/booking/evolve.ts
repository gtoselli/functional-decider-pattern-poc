import type { Event, State } from './types';

export function evolve(state: State, event: Event): State {
  switch (event.type) {
    case 'EVENT_SCHEDULED': {
      return {
        id: event.data.id,
        patientId: event.data.patientId,
        startAt: event.data.startAt,
        cancelledAt: null,
        status: 'scheduled',
        scheduledAt: event.data.scheduledAt,
      };
    }
    case 'EVENT_CANCELLED': {
      if (state.status !== 'scheduled') return state;
      return {
        ...state,
        cancelledAt: event.data.cancelledAt,
      };
    }
    case 'EVENT_RESCHEDULED': {
      if (state.status !== 'scheduled') return state;
      return {
        ...state,
        startAt: event.data.startAt,
      };
    }
    default: {
      const _exhaustive: never = event;
      return _exhaustive;
    }
  }
}
