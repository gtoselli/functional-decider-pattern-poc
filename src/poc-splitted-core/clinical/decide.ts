import type { Command, Event, State } from './types';

export function decide(cmd: Command, state: State): Event[] {
  switch (cmd.type) {
    case 'CLASSIFY_SESSION': {
      // Create a list with all sessions including the new one
      const allSessions = [
        ...state.sessions.map((s) => ({ id: s.id, startAt: s.startAt, oldNumber: s.number })),
        { id: cmd.data.id, startAt: cmd.data.startAt, oldNumber: undefined },
      ];

      // Sort by startAt (ascending - earliest date gets number 1)
      const sortedSessions = allSessions.sort((a, b) => a.startAt.getTime() - b.startAt.getTime());

      // Assign numbers and emit events for impacted sessions
      const events: Event[] = [];
      sortedSessions.forEach((session, index) => {
        const newNumber = index + 1;

        // Emit event if it's a new session or if the number changed
        if (session.oldNumber === undefined || session.oldNumber !== newNumber) {
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
    // default: {
    //   const _exhaustive: never = cmd;
    //   return _exhaustive;
    // }
  }
}
