import type { Event, State } from './types';

export function evolve(state: State, event: Event): State {
  switch (event.type) {
    case 'SERVICE_QUOTED': {
      const existingPriceIndex = state.prices.findIndex((s) => s.id === event.data.id);

      if (existingPriceIndex !== -1) {
        // Update existing session
        const updatedPrices = [...state.prices];
        updatedPrices[existingPriceIndex] = {
          id: event.data.id,
          cost: event.data.cost,
          reason: event.data.reason,
          status: 'quoted',
        };
        return {
          ...state,
          prices: updatedPrices,
        };
      } else {
        // Add new session
        return {
          ...state,
          prices: [
            ...state.prices,
            { id: event.data.id, cost: event.data.cost, reason: event.data.reason, status: 'quoted' },
          ],
        };
      }
    }
    case 'QUOTE_RELEASED':
      return {
        ...state,
        prices: state.prices.map((s) => (s.id === event.data.id ? { ...s, status: 'released' } : s)),
      };
    default: {
      const _exhaustive: never = event;
      return _exhaustive;
    }
  }
}
