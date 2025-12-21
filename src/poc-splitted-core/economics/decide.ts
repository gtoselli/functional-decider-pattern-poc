import type { Command, Event, State } from './types';

export function decide(cmd: Command, state: State): Event[] {
  switch (cmd.type) {
    case 'QUOTE_SERVICE': {
      const existingPrice = state.prices.find((p) => p.id === cmd.data.sessionId);
      const cost = cmd.data.number === 1 ? 0 : 4500;
      const reason = cmd.data.number === 1 ? ('first_session' as const) : ('standard' as const);
      if (existingPrice && existingPrice.cost === cost) return [];

      return [{ data: { id: cmd.data.sessionId, cost: cost, reason }, type: 'SERVICE_QUOTED' }];
    }

    case 'RELEASE_QUOTE': {
      const quote = state.prices.find((p) => p.id === cmd.data.sessionId);
      if (!quote) throw new Error('Quote not found');

      return [{ type: 'QUOTE_RELEASED', data: { id: quote.id } }];
    }
    default: {
      const _exhaustive: never = cmd;
      return _exhaustive;
    }
  }
}
