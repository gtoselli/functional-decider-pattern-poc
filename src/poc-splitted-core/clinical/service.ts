import { createClinicalRepo } from '../infra';

export function createClinicalService() {
  const clinicalRepo = createClinicalRepo();

  return {
    classifySession(params: { patientId: string; appointmentId: string; appointmentStartAt: Date }) {
      const clinical = clinicalRepo.getById(params.patientId);
      clinical.run({
        data: { id: params.appointmentId, startAt: params.appointmentStartAt },
        type: 'CLASSIFY_SESSION',
      });
      clinicalRepo.save(clinical);
    },
  };
}
