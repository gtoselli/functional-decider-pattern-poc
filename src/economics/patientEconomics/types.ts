import type { Decider } from '../../@utils/decider';

export interface State {
  id: string;
}

interface PriceSessionCmd {
  type: 'PRICE_SESSION';
  data: { sessionId: string; number: number };
}

interface VoidSessionPriceCmd {
  type: 'VOID_SESSION_PRICE';
  data: { sessionId: string };
}

export type Command = PriceSessionCmd | VoidSessionPriceCmd;

interface SessionPricedEvent {
  type: 'SESSION_PRICED';
  data: { id: string; cost: number; reason: 'first_session' | 'standard' };
}

interface SessionPriceVoidedEvent {
  type: 'SESSION_PRICE_VOIDED';
  data: { id: string };
}

export type Event = SessionPricedEvent | SessionPriceVoidedEvent;

export type EconomicsDecider = Decider<State, Command, Event>;
