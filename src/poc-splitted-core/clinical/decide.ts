import type { Command, Event, State } from './types';

export function decide(cmd: Command, state: State): Event[] {
  switch (cmd.type) {
    case 'ADMIT_SESSION': {
      const events: Event[] = [{ data: { id: cmd.data.id, startAt: cmd.data.startAt }, type: 'SESSION_ADMITTED' }];

      const sessions = [
        ...state.sessions.map((s) => ({ id: s.id, startAt: s.startAt, oldNumber: s.number })),
        { id: cmd.data.id, startAt: cmd.data.startAt, oldNumber: 0 },
      ];

      events.push(...classifySessions(sessions));

      return events;
    }

    case 'REVOKE_SESSION': {
      const session = state.sessions.find((s) => s.id === cmd.data.id);
      if (!session) throw new Error('Session not found');

      const events: Event[] = [{ data: { id: cmd.data.id, revokedAt: new Date() }, type: 'SESSION_REVOKED' }];

      const remainingSessions = state.sessions
        .filter((s) => s.id !== cmd.data.id)
        .map((s) => ({ id: s.id, startAt: s.startAt, oldNumber: s.number }));

      events.push(...classifySessions(remainingSessions));

      return events;
    }

    case 'REASSESS_SESSION': {
      const session = state.sessions.find((s) => s.id === cmd.data.id);
      if (!session) throw new Error('Session not found');

      const sessions = state.sessions.map((s) =>
        s.id === cmd.data.id
          ? { id: s.id, startAt: cmd.data.startAt, oldNumber: s.number, oldStartAt: s.startAt }
          : { id: s.id, startAt: s.startAt, oldNumber: s.number, oldStartAt: s.startAt },
      );

      return classifySessions(sessions);
    }

    default: {
      const _exhaustive: never = cmd;
      return _exhaustive;
    }
  }
}

function classifySessions(sessions: { id: string; startAt: Date; oldNumber: number; oldStartAt?: Date }[]): Event[] {
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
        },
      });
    }
  });

  return events;
}
