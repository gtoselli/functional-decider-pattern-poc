import type { Decider } from '../../@utils/decider';

export type State = { id: string } & (
  | {
      status: 'initial';
    }
  | {
      status: 'quoted' | 'fulfilled' | 'cancelled';
      patientId: string;
      pricedAt: Date;
      cost: number;
      reason: 'standard' | 'first_session';
      repricedAt: Date | null;
      releasedAt: Date | null;
    }
);

interface PlaceSessionQuoteCmd {
  type: 'PLACE_SESSION_QUOTE';
  data: { cost: number; reason: 'first_session' | 'standard'; patientId: string };
}

interface ReplaceSessionQuoteCmd {
  type: 'REPLACE_SESSION_QUOTE';
  data: { cost: number; reason: 'first_session' | 'standard' };
}

interface VoidSessionQuoteCmd {
  type: 'VOID_SESSION_QUOTE';
  data: {};
}

export type Command = PlaceSessionQuoteCmd | ReplaceSessionQuoteCmd | VoidSessionQuoteCmd;

interface SessionQuotePlacedEvent {
  type: 'SESSION_QUOTE_PLACED';
  data: { id: string; patientId: string; pricedAt: Date; cost: number; reason: 'first_session' | 'standard' };
}
interface SessionQuoteReplacedEvent {
  type: 'SESSION_QUOTE_REPLACED';
  data: { repricedAt: Date; cost: number; reason: 'first_session' | 'standard' };
}
interface SessionQuoteVoidedEvent {
  type: 'SESSION_QUOTE_VOIDED';
  data: { releasedAt: Date };
}
export type Event = SessionQuotePlacedEvent | SessionQuoteReplacedEvent | SessionQuoteVoidedEvent;

export type BillableSessionDecider = Decider<State, Command, Event>;
