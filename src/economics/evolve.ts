import type { Event, State } from './types';

export function evolve(state: State, event: Event): State {
  switch (event.type) {
    case 'PRICES_REVISED': {
      const updatedExisting = state.prices.map((p) => {
        const estimate = event.data.prices.find((e) => e.sessionId === p.id);
        return estimate
          ? { id: estimate.sessionId, status: estimate.status, price: estimate.price, reason: estimate.reason }
          : p;
      });

      const newEstimates = event.data.prices
        .filter((e) => !state.prices.some((p) => p.id === e.sessionId))
        .map((e) => ({ id: e.sessionId, status: e.status, price: e.price, reason: e.reason }));

      return {
        ...state,
        prices: [...updatedExisting, ...newEstimates],
      };
    }

    case 'COVERAGE_ADDED':
      return {
        ...state,
        coverages: [...state.coverages, { type: event.data.type, sessionsCount: event.data.sessionsCount }],
      };
    case 'PRICE_MARKED_AS_CHARGED':
      return {
        ...state,
        prices: state.prices.map((p) => (p.id === event.data.id ? { ...p, status: 'CHARGED' } : p)),
      };

    default: {
      const _exhaustive: never = event;
      return _exhaustive;
    }
  }
}
