import type { Decider } from '../../@utils/decider';

export type State = { id: string } & (
  | {
      status: 'initial';
    }
  | {
      status: 'priced';
      patientId: string;
      pricedAt: Date;
      cost: number;
      reason: 'standard' | 'first_session';
      repricedAt: Date | null;
      releasedAt: Date | null;
    }
);

interface PriceBillableSessionCmd {
  type: 'PRICE_BILLABLE_SESSION';
  data: { cost: number; reason: 'first_session' | 'standard'; patientId: string };
}

interface RepriceBillableSessionCmd {
  type: 'REPRICE_BILLABLE_SESSION';
  data: { cost: number; reason: 'first_session' | 'standard' };
}

interface ReleaseBillableSessionCmd {
  type: 'RELEASE_BILLABLE_SESSION';
  data: {};
}

export type Command = PriceBillableSessionCmd | RepriceBillableSessionCmd | ReleaseBillableSessionCmd;

interface BillableSessionPricedEvent {
  type: 'BILLABLE_SESSION_PRICED';
  data: { id: string; patientId: string; pricedAt: Date; cost: number; reason: 'first_session' | 'standard' };
}
interface BillableSessionRePricedEvent {
  type: 'BILLABLE_SESSION_REPRICED';
  data: { repricedAt: Date; cost: number; reason: 'first_session' | 'standard' };
}
interface BillableSessionReleasedEvent {
  type: 'BILLABLE_SESSION_RELEASED';
  data: { releasedAt: Date };
}
export type Event = BillableSessionPricedEvent | BillableSessionRePricedEvent | BillableSessionReleasedEvent;

export type BillableSessionDecider = Decider<State, Command, Event>;
