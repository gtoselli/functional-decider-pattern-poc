import { randomUUID } from 'node:crypto';
import type { PathType } from '../../shared-types';
import type { createClinicalInMemRepo } from '../infra';

export function createClinicalService(clinicalRepo: ReturnType<typeof createClinicalInMemRepo>) {
  return {
    admitSession(params: { patientId: string; startAt: Date; pathId: string }) {
      const clinical = clinicalRepo.getById(params.patientId);

      const events = clinical.run({
        type: 'ADMIT_SESSION',
        data: { startAt: params.startAt, id: randomUUID(), pathId: params.pathId },
      });

      clinicalRepo.save(clinical);
      return events;
    },

    reassessSession(params: { patientId: string; sessionId: string; startAt: Date }) {
      const clinical = clinicalRepo.getById(params.patientId);

      const events = clinical.run({
        type: 'REASSESS_SESSION',
        data: { startAt: params.startAt, id: params.sessionId },
      });

      clinicalRepo.save(clinical);
      return events;
    },

    revokeSession(params: { patientId: string; sessionId: string }) {
      const clinical = clinicalRepo.getById(params.patientId);

      const events = clinical.run({
        type: 'REVOKE_SESSION',
        data: { id: params.sessionId },
      });

      clinicalRepo.save(clinical);
      return events;
    },

    addProfessional(params: { patientId: string; pathId: string; professionalId: string }) {
      const clinical = clinicalRepo.getById(params.patientId);

      const events = clinical.run({
        type: 'ADD_PROFESSIONAL',
        data: { pathId: params.pathId, professionalId: params.professionalId },
      });

      clinicalRepo.save(clinical);
      return events;
    },

    startPath(params: { patientId: string; pathType: PathType }) {
      const clinical = clinicalRepo.getById(params.patientId);

      const events = clinical.run({
        type: 'START_PATH',
        data: { pathType: params.pathType },
      });

      clinicalRepo.save(clinical);
      return events;
    },

    getSession(patientId: string, sessionId: string) {
      return clinicalRepo
        .getById(patientId)
        .getState()
        .paths.flatMap((p) => p.sessions)
        .find((s) => s.id === sessionId);
    },

    getPath(patientId: string, pathId: string) {
      return clinicalRepo
        .getById(patientId)
        .getState()
        .paths.find((p) => p.id === pathId);
    },

    getPaths(patientId: string) {
      return clinicalRepo.getById(patientId).getState();
    },
  };
}
