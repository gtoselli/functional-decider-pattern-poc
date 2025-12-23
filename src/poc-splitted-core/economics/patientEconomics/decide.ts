import type { Command, Event, State } from './types';

export function decide(cmd: Command, _state: State) {
  switch (cmd.type) {
    case 'QUOTE_SERVICE': {
      const cost = cmd.data.number === 1 ? 0 : 4500;
      const reason = cmd.data.number === 1 ? ('first_session' as const) : ('standard' as const);

      return [{ data: { id: cmd.data.sessionId, cost: cost, reason }, type: 'SERVICE_QUOTED' }] satisfies Event[];
    }

    case 'RELEASE_QUOTE': {
      return [{ data: { id: cmd.data.sessionId }, type: 'QUOTE_RELEASED' }] satisfies Event[];
    }
    default: {
      const _exhaustive: never = cmd;
      return _exhaustive;
    }
  }
}
