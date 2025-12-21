import type { Event, State } from './types';

export function evolve(state: State, event: Event): State {
  switch (event.type) {
    case 'EVENT_SCHEDULED': {
      return {
        ...state,
        events: [...state.events, { id: event.data.id, startAt: event.data.startAt, cancelledAt: null }],
      };
    }
    case 'EVENT_CANCELLED': {
      return {
        ...state,
        events: state.events.map((e) =>
          e.id === event.data.id
            ? {
                ...e,
                cancelledAt: event.data.cancelledAt,
              }
            : e,
        ),
      };
    }
    case 'EVENT_RESCHEDULED': {
      return {
        ...state,
        events: state.events.map((e) =>
          e.id === event.data.id
            ? {
                ...e,
                startAt: event.data.startAt,
              }
            : e,
        ),
      };
    }
    default: {
      const _exhaustive: never = event;
      return _exhaustive;
    }
  }
}
