import type { Event, State } from './types';

export function evolve(state: State, event: Event): State {
  switch (event.type) {
    case 'PRICE_EVALUATED': {
      const existingPriceIndex = state.prices.findIndex((s) => s.id === event.data.id);

      if (existingPriceIndex !== -1) {
        // Update existing session
        const updatedPrices = [...state.prices];
        updatedPrices[existingPriceIndex] = {
          id: event.data.id,
          cost: event.data.cost,
          reason: event.data.reason,
        };
        return {
          ...state,
          prices: updatedPrices,
        };
      } else {
        // Add new session
        return {
          ...state,
          prices: [...state.prices, { id: event.data.id, cost: event.data.cost, reason: event.data.reason }],
        };
      }
    }
    // default: {
    //   const _exhaustive: never = event;
    //   return _exhaustive;
    // }
  }
}
