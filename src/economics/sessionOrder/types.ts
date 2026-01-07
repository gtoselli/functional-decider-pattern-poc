import type { Decider } from '../../@utils/decider';
import type { CostReason } from '../patientEconomics/types';

export type State = { id: string } & (
  | {
      status: 'initial';
    }
  | {
      status: 'quoted' | 'fulfilled' | 'cancelled';
      patientId: string;
      placedAt: Date;
      cost: number;
      reason: CostReason;
      voidedAt: Date | null;
    }
);

interface PlaceSessionOrderCmd {
  type: 'PLACE_SESSION_ORDER';
  data: { cost: number; reason: CostReason; patientId: string };
}

interface VoidSessionOrderCmd {
  type: 'VOID_SESSION_ORDER';
  data: {};
}

export type Command = PlaceSessionOrderCmd | VoidSessionOrderCmd;

interface SessionOrderPlacedEvent {
  type: 'SESSION_ORDER_PLACED';
  data: { id: string; patientId: string; placedAt: Date; cost: number; reason: CostReason };
}

interface SessionOrderVoidedEvent {
  type: 'SESSION_ORDER_VOIDED';
  data: { voidedAt: Date };
}
export type Event = SessionOrderPlacedEvent | SessionOrderVoidedEvent;

export type SessionOrderDecider = Decider<State, Command, Event>;
