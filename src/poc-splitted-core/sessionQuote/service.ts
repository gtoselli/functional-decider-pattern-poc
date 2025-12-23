import type { createSessionEconomicsInMemRepo } from '../infra';

export function createSessionEconomicsService(billableServiceRepo: ReturnType<typeof createSessionEconomicsInMemRepo>) {
  return {
    place(params: { patientId: string; sessionId: string; cost: number; reason: 'first_session' | 'standard' }) {
      const sessionQuote = billableServiceRepo.getById(params.sessionId);

      const events =
        sessionQuote.getState().status === 'initial'
          ? sessionQuote.run({
              type: 'PLACE_SESSION_QUOTE',
              data: { cost: params.cost, reason: params.reason, patientId: params.patientId },
            })
          : sessionQuote.run({
              type: 'REPLACE_SESSION_QUOTE',
              data: { cost: params.cost, reason: params.reason },
            });

      billableServiceRepo.save(sessionQuote);
      return events;
    },

    replace(params: { sessionId: string; cost: number; reason: 'first_session' | 'standard' }) {
      const sessionQuote = billableServiceRepo.getById(params.sessionId);

      const events = sessionQuote.run({
        type: 'REPLACE_SESSION_QUOTE',
        data: { reason: params.reason, cost: params.cost },
      });

      billableServiceRepo.save(sessionQuote);
      return events;
    },

    void(params: { sessionId: string }) {
      const sessionQuote = billableServiceRepo.getById(params.sessionId);

      const events = sessionQuote.run({
        type: 'VOID_SESSION_QUOTE',
        data: {},
      });

      billableServiceRepo.save(sessionQuote);
      return events;
    },

    getBillingSession(sessionId: string) {
      return billableServiceRepo.getById(sessionId).getState();
    },

    getBillingSessions(patientId: string) {
      return billableServiceRepo.getAll(patientId);
    },
  };
}
