import type { Command, Event, State } from './types';

export function decide(cmd: Command, state: State): Event[] {
  switch (cmd.type) {
    case 'PRICE_BILLABLE_SESSION': {
      if (state.status !== 'initial') throw new Error('Billable Session already priced');
      return [
        {
          data: {
            id: state.id,
            patientId: cmd.data.patientId,
            cost: cmd.data.cost,
            reason: cmd.data.reason,
            pricedAt: new Date(),
          },
          type: 'BILLABLE_SESSION_PRICED',
        },
      ];
    }
    case 'REPRICE_BILLABLE_SESSION': {
      if (state.status !== 'priced') throw new Error('Billable Session not priced');

      return [
        {
          data: { repricedAt: new Date(), cost: cmd.data.cost, reason: cmd.data.reason },
          type: 'BILLABLE_SESSION_REPRICED',
        },
      ];
    }
    case 'RELEASE_BILLABLE_SESSION': {
      if (state.status !== 'priced') throw new Error('Billable Session not priced');

      return [{ data: { releasedAt: new Date() }, type: 'BILLABLE_SESSION_RELEASED' }];
    }

    default: {
      const _exhaustive: never = cmd;
      return _exhaustive;
    }
  }
}
