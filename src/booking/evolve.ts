import type { Event, State } from './types';

export function evolve(state: State, event: Event): State {
  switch (event.type) {
    case 'EVENT_SCHEDULED': {
      return {
        id: event.data.id,
        patientId: event.data.patientId,
        startAt: event.data.startAt,
        status: 'scheduled',
        scheduledAt: event.data.scheduledAt,
        outcome: null,
      };
    }
    case 'EVENT_CANCELLED': {
      if (state.status !== 'scheduled') return state;
      return {
        ...state,
        outcome: {
          type: 'cancelled',
          cancelledAt: event.data.cancelledAt,
          cancellationType: event.data.cancellationType,
        },
      };
    }
    case 'EVENT_RESCHEDULED': {
      if (state.status !== 'scheduled') return state;
      return {
        ...state,
        startAt: event.data.startAt,
      };
    }
    case 'EVENT_MARKED_AS_NO_SHOW':
      if (state.status !== 'scheduled') return state;
      return {
        ...state,
        outcome: {
          type: 'no_show',
          markedAt: event.data.markedAsNoShowAt,
        },
      };

    default: {
      const _exhaustive: never = event;
      return _exhaustive;
    }
  }
}
