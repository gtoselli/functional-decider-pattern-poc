import { type Aggregate, createDeciderAggregate } from './@utils/decider';
import { bookingDecider } from './booking';
import type { BookingDecider, State as BookingState } from './booking/types';
import type { ClinicalDecider, State } from './clinical/types';
import type { State as PatientEconomics2State } from './economics/types';

type BookingAggregate = Aggregate<BookingDecider>;

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

export function createClinicalInMemRepo() {
  const STATE: Record<string, State> = {};

  return {
    async save(state: State) {
      STATE[state.id] = state;
    },
    async getById(id: string) {
      return STATE[id] || { id, paths: [] };
    },
  };
}

export function createPatientEconomics2InMemRepo() {
  const STATE: Record<string, PatientEconomics2State> = {};

  return {
    async save(state: PatientEconomics2State): Promise<void> {
      STATE[state.id] = state;
    },
    async getById(id: string): Promise<PatientEconomics2State> {
      return STATE[id] || { id, prices: [], coverages: [] };
    },
  };
}
