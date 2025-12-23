import type { Command, Event, State } from './types';

export function decide(cmd: Command, state: State): Event[] {
  switch (cmd.type) {
    case 'PLACE_SESSION_QUOTE': {
      if (state.status !== 'initial') throw new Error('Session quote already placed');
      return [
        {
          data: {
            id: state.id,
            patientId: cmd.data.patientId,
            cost: cmd.data.cost,
            reason: cmd.data.reason,
            pricedAt: new Date(),
          },
          type: 'SESSION_QUOTE_PLACED',
        },
      ];
    }
    case 'REPLACE_SESSION_QUOTE': {
      if (state.status !== 'quoted') throw new Error('Billable Session not placed');

      return [
        {
          data: { repricedAt: new Date(), cost: cmd.data.cost, reason: cmd.data.reason },
          type: 'SESSION_QUOTE_REPLACED',
        },
      ];
    }
    case 'VOID_SESSION_QUOTE': {
      if (state.status !== 'quoted') throw new Error('Billable Session not placed');

      return [{ data: { releasedAt: new Date() }, type: 'SESSION_QUOTE_VOIDED' }];
    }

    default: {
      const _exhaustive: never = cmd;
      return _exhaustive;
    }
  }
}
