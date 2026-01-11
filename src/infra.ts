import type { State as BookingState } from './booking/types';
import type { State as PatientClinicalState } from './clinical/types';
import type { State as PatientEconomicsState } from './economics/types';

export function createBookingInMemRepo() {
  const STATE: Record<string, BookingState> = {};

  return {
    async save(state: BookingState) {
      STATE[state.id] = state;
    },
    async getById(id: string) {
      return STATE[id] || { id, status: 'initial' as const };
    },
  };
}

export function createClinicalInMemRepo() {
  const STATE: Record<string, PatientClinicalState> = {};

  return {
    async save(state: PatientClinicalState) {
      STATE[state.id] = state;
    },
    async getById(id: string) {
      return STATE[id] || { id, paths: [] };
    },
  };
}

export function createPatientEconomics2InMemRepo() {
  const STATE: Record<string, PatientEconomicsState> = {};

  return {
    async save(state: PatientEconomicsState): Promise<void> {
      STATE[state.id] = state;
    },
    async getById(id: string): Promise<PatientEconomicsState> {
      return STATE[id] || { id, prices: [], coverages: [] };
    },
  };
}
