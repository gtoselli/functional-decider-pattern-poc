import type { Command, Event, State } from './types';

export function decide(cmd: Command, state: State): Event[] {
  switch (cmd.type) {
    case 'PLACE_SESSION_ORDER': {
      if (state.status !== 'initial' && state.status !== 'quoted') throw new Error('Session Order in wrong state');
      return [
        {
          data: {
            id: state.id,
            patientId: cmd.data.patientId,
            cost: cmd.data.cost,
            reason: cmd.data.reason,
            placedAt: new Date(),
          },
          type: 'SESSION_ORDER_PLACED',
        },
      ];
    }

    case 'VOID_SESSION_ORDER': {
      if (state.status !== 'quoted') throw new Error('Session Order not in quoted state');
      return [{ data: { voidedAt: new Date() }, type: 'SESSION_ORDER_VOIDED' }];
    }

    default: {
      const _exhaustive: never = cmd;
      return _exhaustive;
    }
  }
}
