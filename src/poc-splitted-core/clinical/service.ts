import { randomUUID } from 'node:crypto';
import type { PathType } from '../../shared-types';
import type { createClinicalInMemRepo } from '../infra';
import type { ProfessionalRole } from './types';

export function createClinicalService(clinicalRepo: ReturnType<typeof createClinicalInMemRepo>) {
  return {
    async admitSession(params: { patientId: string; startAt: Date; pathId: string }) {
      const clinical = await clinicalRepo.getById(params.patientId);

      const events = clinical.run({
        type: 'ADMIT_SESSION',
        data: { startAt: params.startAt, id: randomUUID(), pathId: params.pathId },
      });

      await clinicalRepo.save(clinical);
      return events;
    },

    async reassessSession(params: { patientId: string; sessionId: string; startAt: Date }) {
      const clinical = await clinicalRepo.getById(params.patientId);

      const events = clinical.run({
        type: 'REASSESS_SESSION',
        data: { startAt: params.startAt, id: params.sessionId },
      });

      await clinicalRepo.save(clinical);
      return events;
    },

    async revokeSession(params: { patientId: string; sessionId: string }) {
      const clinical = await clinicalRepo.getById(params.patientId);

      const events = clinical.run({
        type: 'REVOKE_SESSION',
        data: { id: params.sessionId },
      });

      await clinicalRepo.save(clinical);
      return events;
    },

    async addProfessional(params: {
      patientId: string;
      pathId: string;
      professionalId: string;
      role: ProfessionalRole;
    }) {
      const clinical = await clinicalRepo.getById(params.patientId);

      const events = clinical.run({
        type: 'ADD_PROFESSIONAL',
        data: { pathId: params.pathId, professionalId: params.professionalId, role: params.role },
      });

      await clinicalRepo.save(clinical);
      return events;
    },

    async startPath(params: { patientId: string; pathType: PathType }) {
      const clinical = await clinicalRepo.getById(params.patientId);

      const events = clinical.run({
        type: 'START_PATH',
        data: { pathType: params.pathType },
      });

      await clinicalRepo.save(clinical);
      return events;
    },

    async getSession(patientId: string, sessionId: string) {
      return (await clinicalRepo.getById(patientId))
        .getState()
        .paths.flatMap((p) => p.sessions)
        .find((s) => s.id === sessionId);
    },

    async getPath(patientId: string, pathId: string) {
      return (await clinicalRepo.getById(patientId)).getState().paths.find((p) => p.id === pathId);
    },

    async getPaths(patientId: string) {
      return (await clinicalRepo.getById(patientId)).getState();
    },
  };
}
