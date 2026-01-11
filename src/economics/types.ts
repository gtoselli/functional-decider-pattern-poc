import type { PathType } from '../shared-types';

export interface State {
  id: string;
  prices: {
    id: string;
    status: 'ESTIMATED' | 'LOCKED' | 'CHARGED' | 'VOIDED';
    price: number;
    reason: PriceReason;
  }[];
  coverages: { type: 'discount'; sessionsCount?: number }[];
}

interface ReviseEstimatesCmd {
  type: 'REVISE_ESTIMATES';
  data: {
    sessions: {
      id: string;
      startAt: Date;
      number: number;
      pathType: PathType;
      status: 'cancelled' | 'active' | 'late_cancelled' | 'no_show';
    }[];
  };
}

interface AddCoverageCmd {
  type: 'ADD_COVERAGE';
  data: { type: 'discount'; sessionCount: number };
}

interface MarkPriceAsCharged {
  type: 'MARK_PRICE_AS_CHARGED';
  data: { id: string; chargedAt: Date };
}

export type Command = ReviseEstimatesCmd | AddCoverageCmd | MarkPriceAsCharged;

interface PriceMarkedAsChargedEvent {
  type: 'PRICE_MARKED_AS_CHARGED';
  data: { id: string };
}

interface PricesRevisedEvent {
  type: 'PRICES_REVISED';
  data: {
    prices: {
      sessionId: string;
      status: 'ESTIMATED' | 'VOIDED';
      price: number;
      reason: PriceReason;
    }[];
  };
}

interface CoverageAdded {
  type: 'COVERAGE_ADDED';
  data: { type: 'discount'; sessionsCount?: number };
}

export type Event = PricesRevisedEvent | PriceMarkedAsChargedEvent | CoverageAdded;

export type PriceReason = 'first_session' | 'path_standard' | 'subscription' | 'discount';
