import { getEvent } from '../../@utils/saga';
import type { createPatientEconomicsInMemRepo, createSessionQuoteInMemRepo } from '../infra';

export function createEconomicsService(
  sessionQuoteRepo: ReturnType<typeof createSessionQuoteInMemRepo>,
  patientEconomicsRepo: ReturnType<typeof createPatientEconomicsInMemRepo>,
) {
  return {
    placeSessionQuote(params: { patientId: string; sessionId: string; sessionNumber: number }) {
      const patientEconomics = patientEconomicsRepo.getById(params.patientId);
      const sessionQuote = sessionQuoteRepo.getById(params.sessionId);

      const patientEconomicsEvents = patientEconomics.run({
        type: 'QUOTE_SERVICE',
        data: { sessionId: params.sessionId, number: params.sessionNumber },
      });
      const serviceQuotedEvent = getEvent(patientEconomicsEvents, 'SERVICE_QUOTED');

      const sessionQuoteEvents = sessionQuote.run({
        type: 'PLACE_SESSION_QUOTE',
        data: {
          patientId: params.patientId,
          cost: serviceQuotedEvent.data.cost,
          reason: serviceQuotedEvent.data.reason,
        },
      });

      patientEconomicsRepo.save(patientEconomics);
      sessionQuoteRepo.save(sessionQuote);
      return [...patientEconomicsEvents, ...sessionQuoteEvents];
    },

    voidSessionQuote(params: { patientId: string; sessionId: string }) {
      const patientEconomics = patientEconomicsRepo.getById(params.patientId);
      const sessionQuote = sessionQuoteRepo.getById(params.sessionId);

      const patientEconomicsEvents = patientEconomics.run({
        type: 'RELEASE_QUOTE',
        data: { sessionId: params.sessionId },
      });

      const sessionQuoteEvents = sessionQuote.run({
        type: 'VOID_SESSION_QUOTE',
        data: {},
      });

      patientEconomicsRepo.save(patientEconomics);
      sessionQuoteRepo.save(sessionQuote);
      return [...patientEconomicsEvents, ...sessionQuoteEvents];
    },

    getSessionQuote(sessionId: string) {
      return sessionQuoteRepo.getById(sessionId).getState();
    },

    getSessionQuotes(patientId: string) {
      return sessionQuoteRepo.getAll(patientId);
    },
  };
}
