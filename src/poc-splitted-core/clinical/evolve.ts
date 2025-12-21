import type { Event, State } from './types';

export function evolve(state: State, event: Event): State {
  switch (event.type) {
    case 'SESSION_ADMITTED':
      return {
        ...state,
        sessions: [...state.sessions, { id: event.data.id, startAt: event.data.startAt, number: 0 }],
      };

    case 'SESSION_REVOKED':
      return {
        ...state,
        sessions: state.sessions.map((s) => (s.id === event.data.id ? { ...s, revokedAt: event.data.revokedAt } : s)),
      };

    case 'SESSION_CLASSIFIED': {
      const existingSessionIndex = state.sessions.findIndex((s) => s.id === event.data.id);
      if (existingSessionIndex === -1) throw new Error('Session not found');

      const updatedSessions = [...state.sessions];
      updatedSessions[existingSessionIndex] = {
        ...updatedSessions[existingSessionIndex],
        id: event.data.id,
        number: event.data.number,
        startAt: event.data.startAt,
      };
      return { ...state, sessions: updatedSessions };
    }
    default: {
      const _exhaustive: never = event;
      return _exhaustive;
    }
  }
}
