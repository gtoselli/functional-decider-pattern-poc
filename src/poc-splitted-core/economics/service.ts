import { getEvent } from '../../@utils/saga';
import type { createPatientEconomicsInMemRepo, createSessionOrderInMemRepo } from '../infra';

export function createEconomicsService(
  sessionOrderRepo: ReturnType<typeof createSessionOrderInMemRepo>,
  patientEconomicsRepo: ReturnType<typeof createPatientEconomicsInMemRepo>,
) {
  return {
    placeSessionOrder(params: { patientId: string; sessionId: string; sessionNumber: number }) {
      const patientEconomics = patientEconomicsRepo.getById(params.patientId);
      const sessionOrder = sessionOrderRepo.getById(params.sessionId);

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

      patientEconomicsRepo.save(patientEconomics);
      sessionOrderRepo.save(sessionOrder);
      return [...patientEconomicsEvents, ...sessionOrderEvents];
    },

    voidSessionOrder(params: { patientId: string; sessionId: string }) {
      const patientEconomics = patientEconomicsRepo.getById(params.patientId);
      const sessionOrder = sessionOrderRepo.getById(params.sessionId);

      const patientEconomicsEvents = patientEconomics.run({
        type: 'VOID_SESSION_PRICE',
        data: { sessionId: params.sessionId },
      });

      const sessionOrderEvents = sessionOrder.run({
        type: 'VOID_SESSION_ORDER',
        data: {},
      });

      patientEconomicsRepo.save(patientEconomics);
      sessionOrderRepo.save(sessionOrder);
      return [...patientEconomicsEvents, ...sessionOrderEvents];
    },

    getSessionOrder(sessionId: string) {
      return sessionOrderRepo.getById(sessionId).getState();
    },

    getSessionOrders(patientId: string) {
      return sessionOrderRepo.getAll(patientId);
    },
  };
}
