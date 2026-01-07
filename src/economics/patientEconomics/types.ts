import type { Decider } from '../../@utils/decider';
import type { PathType } from '../../shared-types';

export type SubscriptionStatus = 'active' | 'ended' | 'cancelled';
export type CostReason = 'first_session' | 'path_standard' | 'subscription';

export interface State {
  id: string;
  subscription?: { status: SubscriptionStatus };
}

interface PriceSessionCmd {
  type: 'PRICE_SESSION';
  data: { sessionId: string; number: number; pathType: PathType };
}

interface VoidSessionPriceCmd {
  type: 'VOID_SESSION_PRICE';
  data: { sessionId: string };
}

interface SetSubscriptionStatusCmd {
  type: 'SET_SUBSCRIPTION_STATUS';
  data: { status: SubscriptionStatus };
}

export type Command = PriceSessionCmd | VoidSessionPriceCmd | SetSubscriptionStatusCmd;

interface SessionPricedEvent {
  type: 'SESSION_PRICED';
  data: { id: string; cost: number; reason: CostReason };
}

interface SessionPriceVoidedEvent {
  type: 'SESSION_PRICE_VOIDED';
  data: { id: string };
}

interface SubscriptionStatusSetEvent {
  type: 'SUBSCRIPTION_STATUS_SET';
  data: { status: SubscriptionStatus };
}

export type Event = SessionPricedEvent | SessionPriceVoidedEvent | SubscriptionStatusSetEvent;

export type EconomicsDecider = Decider<State, Command, Event>;
