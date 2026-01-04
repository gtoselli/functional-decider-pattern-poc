import { getEvent } from '../../@utils/saga';
import type { createPatientEconomicsInMemRepo, createSessionOrderInMemRepo } from '../infra';

export function createEconomicsService(
  sessionOrderRepo: ReturnType<typeof createSessionOrderInMemRepo>,
  patientEconomicsRepo: ReturnType<typeof createPatientEconomicsInMemRepo>,
) {
  return {
    async placeSessionOrder(params: { patientId: string; sessionId: string; sessionNumber: number }) {
      const patientEconomics = await patientEconomicsRepo.getById(params.patientId);
      const sessionOrder = await sessionOrderRepo.getById(params.sessionId);

      const patientEconomicsEvents = patientEconomics.run({
        type: 'PRICE_SESSION',
        data: { sessionId: params.sessionId, number: params.sessionNumber },
      });
      const sessionPricedEvent = getEvent(patientEconomicsEvents, 'SESSION_PRICED');

      const sessionOrderEvents = sessionOrder.run({
        type: 'PLACE_SESSION_ORDER',
        data: {
          patientId: params.patientId,
          cost: sessionPricedEvent.data.cost,
          reason: sessionPricedEvent.data.reason,
        },
      });

      await patientEconomicsRepo.save(patientEconomics);
      await sessionOrderRepo.save(sessionOrder);
      return [...patientEconomicsEvents, ...sessionOrderEvents];
    },

    async voidSessionOrder(params: { patientId: string; sessionId: string }) {
      const patientEconomics = await patientEconomicsRepo.getById(params.patientId);
      const sessionOrder = await sessionOrderRepo.getById(params.sessionId);

      const patientEconomicsEvents = patientEconomics.run({
        type: 'VOID_SESSION_PRICE',
        data: { sessionId: params.sessionId },
      });

      const sessionOrderEvents = sessionOrder.run({
        type: 'VOID_SESSION_ORDER',
        data: {},
      });

      await patientEconomicsRepo.save(patientEconomics);
      await sessionOrderRepo.save(sessionOrder);
      return [...patientEconomicsEvents, ...sessionOrderEvents];
    },

    async getSessionOrder(sessionId: string) {
      return (await sessionOrderRepo.getById(sessionId)).getState();
    },

    async getSessionOrders(patientId: string) {
      return await sessionOrderRepo.getAll(patientId);
    },
  };
}
