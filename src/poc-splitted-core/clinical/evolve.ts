import type { Event, State } from './types';

export function evolve(state: State, event: Event): State {
  switch (event.type) {
    case 'SESSION_CLASSIFIED': {
      const existingSessionIndex = state.sessions.findIndex(s => s.id === event.data.id);

      if (existingSessionIndex !== -1) {
        // Update existing session
        const updatedSessions = [...state.sessions];
        updatedSessions[existingSessionIndex] = {
          id: event.data.id,
          number: event.data.number,
          startAt: event.data.startAt
        };
        return {
          ...state,
          sessions: updatedSessions
        };
      } else {
        // Add new session
        return {
          ...state,
          sessions: [...state.sessions, { id: event.data.id, number: event.data.number, startAt: event.data.startAt }],
        };
      }
    }
    // default: {
    //   const _exhaustive: never = event;
    //   return _exhaustive;
    // }
  }
}
