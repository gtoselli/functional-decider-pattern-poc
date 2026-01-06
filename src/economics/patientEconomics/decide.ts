import type { Command, Event, State } from './types';

export function decide(cmd: Command, _state: State): Event[] {
  switch (cmd.type) {
    case 'PRICE_SESSION': {
      const cost = cmd.data.number === 1 ? 0 : 4500;
      const reason = cmd.data.number === 1 ? ('first_session' as const) : ('standard' as const);

      return [{ data: { id: cmd.data.sessionId, cost: cost, reason }, type: 'SESSION_PRICED' }];
    }

    case 'VOID_SESSION_PRICE': {
      return [{ data: { id: cmd.data.sessionId }, type: 'SESSION_PRICE_VOIDED' }];
    }
    default: {
      const _exhaustive: never = cmd;
      return _exhaustive;
    }
  }
}
