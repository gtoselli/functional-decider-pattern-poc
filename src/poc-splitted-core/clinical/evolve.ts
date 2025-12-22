import type { Event, State } from './types';

export function evolve(state: State, event: Event): State {
  switch (event.type) {
    case 'PATH_STARTED':
      return {
        ...state,
        paths: [
          ...state.paths,
          {
            id: event.data.id,
            type: event.data.pathType,
            startedAt: event.data.startedAt,
            professionals: [],
            sessions: [],
          },
        ],
      };

    case 'SESSION_ADMITTED':
      return {
        ...state,
        paths: state.paths.map((p) =>
          p.id === event.data.pathId
            ? { ...p, sessions: [...p.sessions, { id: event.data.id, startAt: event.data.startAt, number: 0 }] }
            : p,
        ),
      };

    case 'SESSION_REVOKED':
      return {
        ...state,
        paths: state.paths.map((p) =>
          p.id === event.data.pathId
            ? {
                ...p,
                sessions: p.sessions.map((s) =>
                  s.id === event.data.id ? { ...s, revokedAt: event.data.revokedAt } : s,
                ),
              }
            : p,
        ),
      };

    case 'SESSION_CLASSIFIED': {
      return {
        ...state,
        paths: state.paths.map((p) =>
          p.id === event.data.pathId
            ? {
                ...p,
                sessions: p.sessions.map((s) =>
                  s.id === event.data.id ? { ...s, number: event.data.number, startAt: event.data.startAt } : s,
                ),
              }
            : p,
        ),
      };
    }

    case 'PROFESSIONAL_ADDED':
      return {
        ...state,
        paths: state.paths.map((s) =>
          s.id === event.data.pathId
            ? {
                ...s,
                professionals: [...s.professionals, { id: event.data.professionalId, addedAt: event.data.addedAt }],
              }
            : s,
        ),
      };
    default: {
      const _exhaustive: never = event;
      return _exhaustive;
    }
  }
}
