import { type Aggregate, createDeciderAggregate } from '../@utils/decider';
import { bookingDecider } from './booking';
import type { BookingDecider } from './booking/types';
import { clinicalDecider } from './clinical';
import type { ClinicalDecider } from './clinical/types';
import { economicsDecider } from './economics';
import type { EconomicsDecider } from './economics/types';

type BookingAggregate = Aggregate<BookingDecider>;
type ClinicalAggregate = Aggregate<ClinicalDecider>;
type EconomicsAggregate = Aggregate<EconomicsDecider>;

export function createBookingRepo() {
  const STATE: Record<string, ReturnType<BookingAggregate['getState']>> = {};

  return {
    save(aggregate: BookingAggregate) {
      STATE[aggregate.getState().id] = aggregate.getState();
    },
    getById(id: string) {
      return createDeciderAggregate(bookingDecider, STATE[id] || { id, events: [] });
    },
  };
}

export function createClinicalRepo() {
  const STATE: Record<string, ReturnType<ClinicalAggregate['getState']>> = {};

  return {
    save(aggregate: ClinicalAggregate) {
      STATE[aggregate.getState().id] = aggregate.getState();
    },
    getById(id: string) {
      return createDeciderAggregate(clinicalDecider, STATE[id] || { id, sessions: [] });
    },
  };
}

export function createEconomicsRepo() {
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
