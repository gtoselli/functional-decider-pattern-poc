import { randomUUID } from 'node:crypto';
import type { PathType } from '../shared-types';
import type { Command, Event, ProfessionalRole, State } from './types';

export function decide(cmd: Command, state: State): Event[] {
  switch (cmd.type) {
    case 'START_PATH': {
      return [{ data: { startedAt: new Date(), id: randomUUID(), pathType: cmd.data.pathType }, type: 'PATH_STARTED' }];
    }

    case 'ADD_SESSION': {
      const path = state.paths.find((p) => p.id);
      if (!path) throw new Error('Path not found');

      const firstSession = path.sessions.find((s) => s.number === 1);
      if (firstSession && cmd.data.startAt.getTime() < firstSession.startAt.getTime())
        throw new Error('CANNOT_SCHEDULE_BEFORE_FIRST_SESSION');

      const sessionNumber = calculateNewSessionNumber(path, cmd.data.id, cmd.data.startAt);
      assertCanAddSession(path, sessionNumber);

      const events: Event[] = [
        { data: { id: cmd.data.id, startAt: cmd.data.startAt, pathId: cmd.data.pathId }, type: 'SESSION_ADDED' },
      ];

      const sessions = [
        ...path.sessions.map((s) => ({ id: s.id, startAt: s.startAt, oldNumber: s.number })),
        { id: cmd.data.id, startAt: cmd.data.startAt, oldNumber: 0 },
      ];
      events.push(...classifySessions(sessions, path.id));

      return events;
    }

    case 'REMOVE_SESSION': {
      const path = getPathBySessionId(state, cmd.data.id);
      getSessionById(path, cmd.data.id);

      const events: Event[] = [
        { data: { id: cmd.data.id, revokedAt: new Date(), pathId: path.id }, type: 'SESSION_REMOVED' },
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
      const path = state.paths.find((p) => p.id === cmd.data.pathId);
      if (!path) throw new Error('Path not found');
      if (path.professionals.find((p) => p.id === cmd.data.professionalId))
        throw new Error('Professional already in the path');
      if (path.professionals.find((p) => p.role === cmd.data.role))
        throw new Error('Professional role already in the path');
      if (!professionalRoleIsAllowedForPath(cmd.data.role, path.type)) throw new Error('Role not allowed for path');

      return [
        {
          data: { pathId: path.id, professionalId: cmd.data.professionalId, addedAt: new Date(), role: cmd.data.role },
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

function calculateSessionNumbers(sessions: { id: string; startAt: Date }[]): { id: string; number: number }[] {
  const sortedSessions = [...sessions].sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
  return sortedSessions.map((session, index) => ({
    id: session.id,
    number: index + 1,
  }));
}

function calculateNewSessionNumber(path: State['paths'][0], newSessionId: string, newStartAt: Date): number {
  const allSessions = [
    ...path.sessions.map((s) => ({ id: s.id, startAt: s.startAt })),
    { id: newSessionId, startAt: newStartAt },
  ];
  return calculateSessionNumbers(allSessions).find((s) => s.id === newSessionId)!.number;
}

function classifySessions(
  sessions: { id: string; startAt: Date; oldNumber: number; oldStartAt?: Date }[],
  pathId: string,
): Event[] {
  const numberedSessions = calculateSessionNumbers(sessions);

  const events: Event[] = [];
  numberedSessions.forEach((numbered) => {
    // biome-ignore lint/style/noNonNullAssertion: not needeed
    const session = sessions.find((s) => s.id === numbered.id)!;
    const numberChanged = session.oldNumber !== numbered.number;
    const startAtChanged = session.oldStartAt && session.startAt.getTime() !== session.oldStartAt.getTime();

    if (numberChanged || startAtChanged) {
      events.push({
        type: 'SESSION_CLASSIFIED',
        data: {
          id: session.id,
          number: numbered.number,
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

function professionalRoleIsAllowedForPath(role: ProfessionalRole, pathType: PathType) {
  if (pathType === 'wlm') return ['dietitian', 'nutritionist'].includes(role);
  else if (pathType === 'psychotherapy') return role === 'professional';
  throw new Error('Unknown pathType');
}

function assertCanAddSession(path: State['paths'][0], sessionNumber: number) {
  if (path.type === 'psychotherapy') return;
  else if (path.type === 'wlm') {
    if (sessionNumber === 1) return;
    if (!path.cycle) throw new Error('PATH_CYCLE_NOT_STARTED');
    if (path.cycle.endedAt) throw new Error('PATH_CYCLE_ENDED');
    //TODO add step logic
  }
}
