import { type Aggregate, createDeciderAggregate } from '../@utils/decider';
import { billableSessionDecider } from './billableSession';
import type { BillableSessionDecider, State as BillableSessionState } from './billableSession/types';
import { bookingDecider } from './booking';
import type { BookingDecider, State as BookingState } from './booking/types';
import { clinicalDecider } from './clinical';
import type { ClinicalDecider } from './clinical/types';
import { economicsDecider } from './patientEconomics';
import type { EconomicsDecider } from './patientEconomics/types';

type BookingAggregate = Aggregate<BookingDecider>;
type ClinicalAggregate = Aggregate<ClinicalDecider>;
type EconomicsAggregate = Aggregate<EconomicsDecider>;
type BillableSessionAggregate = Aggregate<BillableSessionDecider>;

export function createBookingInMemRepo() {
  const STATE = new Map<string, BookingState>();

  return {
    save(aggregate: BookingAggregate) {
      STATE.set(aggregate.getState().id, aggregate.getState());
    },
    getById(id: string) {
      const state = STATE.get(id);
      return createDeciderAggregate(bookingDecider, state || { id, status: 'initial' as const });
    },
  };
}

export function createBillableSessionInMemRepo() {
  const STATE = new Map<string, BillableSessionState>();

  return {
    save(aggregate: BillableSessionAggregate) {
      STATE.set(aggregate.getState().id, aggregate.getState());
    },
    getById(id: string) {
      const state = STATE.get(id);
      return createDeciderAggregate(billableSessionDecider, state || { id, status: 'initial' as const });
    },

    getAll(patientId: string) {
      return Array.from(STATE, ([_id, value]) => ({ ...value })).filter((bs) =>
        bs.status === 'priced' ? bs.patientId === patientId : false,
      );
    },
  };
}

export function createClinicalInMemRepo() {
  const STATE: Record<string, ReturnType<ClinicalAggregate['getState']>> = {};

  return {
    save(aggregate: ClinicalAggregate) {
      STATE[aggregate.getState().id] = aggregate.getState();
    },
    getById(id: string) {
      return createDeciderAggregate(clinicalDecider, STATE[id] || { id, paths: [] });
    },
  };
}

export function createEconomicsInMemRepo() {
  const STATE: Record<string, ReturnType<EconomicsAggregate['getState']>> = {};

  return {
    save(aggregate: EconomicsAggregate) {
      STATE[aggregate.getState().id] = aggregate.getState();
    },
    getById(id: string) {
      return createDeciderAggregate(economicsDecider, STATE[id] || { id, prices: [] });
    },
  };
}
