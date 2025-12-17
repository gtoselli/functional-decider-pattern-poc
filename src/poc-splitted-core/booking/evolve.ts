import type { Event, State } from './types';

export function evolve(state: State, event: Event): State {
  switch (event.type) {
    case 'APPOINTMENT_SCHEDULED': {
      return {
        ...state,
        appointments: [...state.appointments, { id: event.data.id, startAt: event.data.startAt, cancelledAt: null }],
      };
    }
    case 'APPOINTMENT_CANCELLED': {
      return {
        ...state,
        appointments: state.appointments.map((a) =>
          a.id === event.data.id
            ? {
                ...a,
                cancelledAt: event.data.cancelledAt,
              }
            : a,
        ),
      };
    }
    case 'APPOINTMENT_RESCHEDULED': {
      return {
        ...state,
        appointments: state.appointments.map((a) =>
          a.id === event.data.id
            ? {
                ...a,
                startAt: event.data.startAt,
              }
            : a,
        ),
      };
    }
    default: {
      const _exhaustive: never = event;
      return _exhaustive;
    }
  }
}
