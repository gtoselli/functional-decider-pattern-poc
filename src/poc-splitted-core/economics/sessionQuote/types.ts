import type { Decider } from '../../../@utils/decider';

export type State = { id: string } & (
  | {
      status: 'initial';
    }
  | {
      status: 'quoted' | 'fulfilled' | 'cancelled';
      patientId: string;
      placedAt: Date;
      cost: number;
      reason: 'standard' | 'first_session';
      voidedAt: Date | null;
    }
);

interface PlaceSessionQuoteCmd {
  type: 'PLACE_SESSION_QUOTE';
  data: { cost: number; reason: 'first_session' | 'standard'; patientId: string };
}

interface VoidSessionQuoteCmd {
  type: 'VOID_SESSION_QUOTE';
  data: {};
}

export type Command = PlaceSessionQuoteCmd | VoidSessionQuoteCmd;

interface SessionQuotePlacedEvent {
  type: 'SESSION_QUOTE_PLACED';
  data: { id: string; patientId: string; placedAt: Date; cost: number; reason: 'first_session' | 'standard' };
}

interface SessionQuoteVoidedEvent {
  type: 'SESSION_QUOTE_VOIDED';
  data: { voidedAt: Date };
}
export type Event = SessionQuotePlacedEvent | SessionQuoteVoidedEvent;

export type BillableSessionDecider = Decider<State, Command, Event>;
