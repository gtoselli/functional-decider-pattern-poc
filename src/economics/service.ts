import type { ClinicalService } from '../clinical/service';
import type { createPatientEconomics2InMemRepo } from '../infra';
import { decide } from './decide';
import { evolve } from './evolve';

export function createEconomicsService(
  patientEconomicsRepo: ReturnType<typeof createPatientEconomics2InMemRepo>,
  clinicalService: ClinicalService,
) {
  return {
    async refreshPathEstimates(params: { patientId: string; pathId: string }) {
      const state = await patientEconomicsRepo.getById(params.patientId);
      const sessions = await clinicalService.getSessions(params.patientId);

      const events = decide({ type: 'REVISE_ESTIMATES', data: { sessions } }, state);

      await patientEconomicsRepo.save(events.reduce(evolve, state));

      return events;
    },

    async getSessionPrice(patientId: string, sessionId: string) {
      const state = await patientEconomicsRepo.getById(patientId);
      return state.prices.find((p) => p.id === sessionId);
    },

    async getSessionsPrice(patientId: string) {
      const state = await patientEconomicsRepo.getById(patientId);
      return state.prices;
    },
  };
}

export type EconomicsService = ReturnType<typeof createEconomicsService>;
