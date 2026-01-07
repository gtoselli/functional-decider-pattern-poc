import { randomUUID } from 'node:crypto';
import type { createClinicalInMemRepo2 } from '../infra';
import type { PathType } from '../shared-types';
import { decide } from './decide';
import { evolve } from './evolve';
import type { ProfessionalRole } from './types';

export function createClinicalService(clinicalRepo: ReturnType<typeof createClinicalInMemRepo2>) {
  return {
    async addSession(params: { patientId: string; startAt: Date; pathId: string }) {
      const state = await clinicalRepo.getById(params.patientId);
      const events = decide(
        {
          type: 'ADD_SESSION',
          data: { startAt: params.startAt, id: randomUUID(), pathId: params.pathId },
        },
        state,
      );

      await clinicalRepo.save(events.reduce(evolve, state));
      return events;
    },

    async reassessSession(params: { patientId: string; sessionId: string; startAt: Date }) {
      const state = await clinicalRepo.getById(params.patientId);

      const events = decide(
        {
          type: 'REASSESS_SESSION',
          data: { startAt: params.startAt, id: params.sessionId },
        },
        state,
      );

      await clinicalRepo.save(events.reduce(evolve, state));
      return events;
    },

    async removeSession(params: { patientId: string; sessionId: string }) {
      const state = await clinicalRepo.getById(params.patientId);

      const events = decide(
        {
          type: 'REMOVE_SESSION',
          data: { id: params.sessionId },
        },
        state,
      );

      await clinicalRepo.save(events.reduce(evolve, state));
      return events;
    },

    async addProfessional(params: {
      patientId: string;
      pathId: string;
      professionalId: string;
      role: ProfessionalRole;
    }) {
      const state = await clinicalRepo.getById(params.patientId);

      const events = decide(
        {
          type: 'ADD_PROFESSIONAL',
          data: { pathId: params.pathId, professionalId: params.professionalId, role: params.role },
        },
        state,
      );

      await clinicalRepo.save(events.reduce(evolve, state));
      return events;
    },

    async startPath(params: { patientId: string; pathType: PathType }) {
      const state = await clinicalRepo.getById(params.patientId);

      const events = decide(
        {
          type: 'START_PATH',
          data: { pathType: params.pathType },
        },
        state,
      );

      await clinicalRepo.save(events.reduce(evolve, state));
      return events;
    },

    async getSession(patientId: string, sessionId: string) {
      return (await clinicalRepo.getById(patientId)).paths.flatMap((p) => p.sessions).find((s) => s.id === sessionId);
    },

    async getPath(patientId: string, pathId: string) {
      return (await clinicalRepo.getById(patientId)).paths.find((p) => p.id === pathId)!;
    },

    async getPaths(patientId: string) {
      return await clinicalRepo.getById(patientId);
    },
  };
}

export type ClinicalService = ReturnType<typeof createClinicalService>;
