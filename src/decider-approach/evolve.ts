import type { Event, State } from './types';

export function evolve(currentState: State, event: Event): State {
  switch (event.type) {
    case 'PATH_STARTED': {
      return {
        ...currentState,
        paths: [
          ...currentState.paths,
          {
            id: event.data.pathId,
            professionals: [
              {
                id: event.data.professionalId,
                role: event.data.professionalRole,
              },
            ],
            sessions: [],
            type: event.data.type,
          },
        ],
      };
    }
    case 'PROFESSIONAL_ADDED': {
      return {
        ...currentState,
        paths: currentState.paths.map((p) =>
          p.type === event.data.pathType
            ? {
                ...p,
                professionals: [
                  ...p.professionals,
                  {
                    id: event.data.professionalId,
                    role: event.data.professionalRole,
                  },
                ],
              }
            : p,
        ),
      };
    }
    case 'SESSION_SCHEDULED': {
      return {
        ...currentState,
        paths: currentState.paths.map((p) =>
          p.type === event.data.pathType
            ? {
                ...p,
                sessions: [
                  ...p.sessions,
                  {
                    duration: event.data.duration,
                    id: event.data.sessionId,
                    startAt: event.data.startAt,
                    state: event.data.state,
                    sequence: event.data.sequence,
                  },
                ],
              }
            : p,
        ),
      };
    }
    case 'SESSIONS_SEQUENCE_CHANGED': {
      return {
        ...currentState,
        paths: currentState.paths.map((p) =>
          p.type === event.data.pathType
            ? {
                ...p,
                sessions: p.sessions.map((session) => {
                  const updatedSession = event.data.sessions.find((s) => s.sessionId === session.id);
                  return updatedSession ? { ...session, sequence: updatedSession.sequence } : session;
                }),
              }
            : p,
        ),
      };
    }
    default: {
      const _: never = event;
      throw new Error('Unknown event');
    }
  }
}
