import { randomUUID } from 'node:crypto';
import type { Command, Event, State } from './types';

export function decide(cmd: Command, state: State): Event[] {
  switch (cmd.type) {
    case 'START_PATH': {
      return [{ data: { startedAt: new Date(), id: randomUUID(), pathType: cmd.data.pathType }, type: 'PATH_STARTED' }];
    }

    case 'ADMIT_SESSION': {
      const path = state.paths.find((p) => p.id);
      if (!path) throw new Error('Path not found');

      const events: Event[] = [
        { data: { id: cmd.data.id, startAt: cmd.data.startAt, pathId: cmd.data.pathId }, type: 'SESSION_ADMITTED' },
      ];

      const sessions = [
        ...path.sessions.map((s) => ({ id: s.id, startAt: s.startAt, oldNumber: s.number })),
        { id: cmd.data.id, startAt: cmd.data.startAt, oldNumber: 0 },
      ];

      events.push(...classifySessions(sessions, path.id));

      return events;
    }

    case 'REVOKE_SESSION': {
      const path = getPathBySessionId(state, cmd.data.id);
      getSessionById(path, cmd.data.id);

      const events: Event[] = [
        { data: { id: cmd.data.id, revokedAt: new Date(), pathId: path.id }, type: 'SESSION_REVOKED' },
      ];

      const remainingSessions = path.sessions
        .filter((s) => s.id !== cmd.data.id)
        .map((s) => ({ id: s.id, startAt: s.startAt, oldNumber: s.number }));

      events.push(...classifySessions(remainingSessions, path.id));

      return events;
    }

    case 'REASSESS_SESSION': {
      const path = getPathBySessionId(state, cmd.data.id);
      getSessionById(path, cmd.data.id);

      const sessions = path.sessions.map((s) =>
        s.id === cmd.data.id
          ? { id: s.id, startAt: cmd.data.startAt, oldNumber: s.number, oldStartAt: s.startAt }
          : { id: s.id, startAt: s.startAt, oldNumber: s.number, oldStartAt: s.startAt },
      );

      return classifySessions(sessions, path.id);
    }

    case 'ADD_PROFESSIONAL': {
      const path = state.paths.find((p) => p.id);
      if (!path) throw new Error('Path not found');
      if (path.professionals.find((p) => p.id === cmd.data.professionalId))
        throw new Error('Professional already in the path');

      return [
        {
          data: { pathId: path.id, professionalId: cmd.data.professionalId, addedAt: new Date() },
          type: 'PROFESSIONAL_ADDED',
        },
      ];
    }

    default: {
      const _exhaustive: never = cmd;
      return _exhaustive;
    }
  }
}

function classifySessions(
  sessions: { id: string; startAt: Date; oldNumber: number; oldStartAt?: Date }[],
  pathId: string,
): Event[] {
  const sortedSessions = sessions.sort((a, b) => a.startAt.getTime() - b.startAt.getTime());

  const events: Event[] = [];
  sortedSessions.forEach((session, index) => {
    const newNumber = index + 1;
    const numberChanged = session.oldNumber !== newNumber;
    const startAtChanged = session.oldStartAt && session.startAt.getTime() !== session.oldStartAt.getTime();

    if (numberChanged || startAtChanged) {
      events.push({
        type: 'SESSION_CLASSIFIED',
        data: {
          id: session.id,
          number: newNumber,
          startAt: session.startAt,
          pathId,
        },
      });
    }
  });

  return events;
}

function getPathBySessionId(state: State, sessionId: string) {
  const path = state.paths.find((p) => p.sessions.find((s) => s.id === sessionId));
  if (!path) throw new Error('Path not found');
  return path;
}

function getSessionById(path: State['paths'][0], sessionId: string) {
  const session = path.sessions.find((s) => s.id === sessionId);
  if (!session) throw new Error('Session not found');
  return session;
}
