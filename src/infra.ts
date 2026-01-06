import { type Aggregate, createDeciderAggregate } from './@utils/decider';
import { bookingDecider } from './booking';
import type { BookingDecider, State as BookingState } from './booking/types';
import { clinicalDecider } from './clinical';
import type { ClinicalDecider } from './clinical/types';
import { economicsDecider } from './economics/patientEconomics';
import type { EconomicsDecider } from './economics/patientEconomics/types';
import { sessionOrderDecider } from './economics/sessionOrder';
import type { SessionOrderDecider, State as SessionOrderState } from './economics/sessionOrder/types';

type BookingAggregate = Aggregate<BookingDecider>;
type ClinicalAggregate = Aggregate<ClinicalDecider>;
type EconomicsAggregate = Aggregate<EconomicsDecider>;
type BillableSessionAggregate = Aggregate<SessionOrderDecider>;

export function createBookingInMemRepo() {
  const STATE = new Map<string, BookingState>();

  return {
    async save(aggregate: BookingAggregate) {
      STATE.set(aggregate.getState().id, aggregate.getState());
    },
    async getById(id: string) {
      const state = STATE.get(id);
      return createDeciderAggregate(bookingDecider, state || { id, status: 'initial' as const });
    },
  };
}

export function createSessionOrderInMemRepo() {
  const STATE = new Map<string, SessionOrderState>();

  return {
    async save(aggregate: BillableSessionAggregate) {
      STATE.set(aggregate.getState().id, aggregate.getState());
    },
    async getById(id: string) {
      const state = STATE.get(id);
      return createDeciderAggregate(sessionOrderDecider, state || { id, status: 'initial' as const });
    },

    async getAll(patientId: string) {
      return Array.from(STATE, ([_id, value]) => ({ ...value })).filter((bs) =>
        bs.status !== 'initial' ? bs.patientId === patientId : false,
      );
    },
  };
}

export function createClinicalInMemRepo() {
  const STATE: Record<string, ReturnType<ClinicalAggregate['getState']>> = {};

  return {
    async save(aggregate: ClinicalAggregate) {
      STATE[aggregate.getState().id] = aggregate.getState();
    },
    async getById(id: string) {
      return createDeciderAggregate(clinicalDecider, STATE[id] || { id, paths: [] });
    },
  };
}

export function createPatientEconomicsInMemRepo() {
  const STATE: Record<string, ReturnType<EconomicsAggregate['getState']>> = {};

  return {
    async save(aggregate: EconomicsAggregate) {
      STATE[aggregate.getState().id] = aggregate.getState();
    },
    async getById(id: string) {
      return createDeciderAggregate(economicsDecider, STATE[id] || { id, prices: [] });
    },
  };
}
