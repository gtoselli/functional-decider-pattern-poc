import type { createClinicalInMemRepo } from '../infra';
import type { PathType } from '../shared-types';
import { decide } from './decide';
import { evolve } from './evolve';
import type { ProfessionalRole, RemovalReason } from './types';

export function createClinicalService(clinicalRepo: ReturnType<typeof createClinicalInMemRepo>) {
  return {
    async addSession(params: { patientId: string; startAt: Date; pathId: string; eventId: string }) {
      const state = await clinicalRepo.getById(params.patientId);
      const events = decide(
        {
          type: 'ADD_SESSION',
          data: { startAt: params.startAt, id: params.eventId, pathId: params.pathId },
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

    async removeSession(params: { patientId: string; sessionId: string; reason: RemovalReason }) {
      const state = await clinicalRepo.getById(params.patientId);

      const events = decide(
        {
          type: 'REMOVE_SESSION',
          data: { id: params.sessionId, reason: params.reason },
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

    async getSessions(patientId: string) {
      const state = await clinicalRepo.getById(patientId);
      const path = state.paths;
      if (!path) throw new Error('Path not found');

      return state.paths.flatMap((p) =>
        p.sessions.map((s) => ({
          id: s.id,
          number: s.number,
          startAt: s.startAt,
          pathType: p.type,
          status: s.removalReason === null ? ('active' as const) : s.removalReason,
        })),
      );
    },
  };
}

export type ClinicalService = ReturnType<typeof createClinicalService>;
