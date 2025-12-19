import { createEconomicsRepo } from '../infra';

export function createEconomicsService() {
  const economicsRepo = createEconomicsRepo();

  return {
    evaluatePrice(params: { patientId: string; sessionId: string; sessionNumber: number }) {
      const economics = economicsRepo.getById(params.patientId);
      economics.run({ data: { sessionId: params.sessionId, number: params.sessionNumber }, type: 'EVALUATE_PRICE' });
      economicsRepo.save(economics);
    },
  };
}
