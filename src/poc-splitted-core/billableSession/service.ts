import type { createBillableSessionInMemRepo } from '../infra';

export function createBillableSessionService(billableServiceRepo: ReturnType<typeof createBillableSessionInMemRepo>) {
  return {
    priceBillableSession(params: {
      patientId: string;
      sessionId: string;
      cost: number;
      reason: 'first_session' | 'standard';
    }) {
      const billableSession = billableServiceRepo.getById(params.sessionId);

      const events =
        billableSession.getState().status === 'initial'
          ? billableSession.run({
              type: 'PRICE_BILLABLE_SESSION',
              data: { cost: params.cost, reason: params.reason, patientId: params.patientId },
            })
          : billableSession.run({
              type: 'REPRICE_BILLABLE_SESSION',
              data: { cost: params.cost, reason: params.reason },
            });

      billableServiceRepo.save(billableSession);
      return events;
    },

    repriceBillableSession(params: { sessionId: string; cost: number; reason: 'first_session' | 'standard' }) {
      const billableSession = billableServiceRepo.getById(params.sessionId);

      const events = billableSession.run({
        type: 'REPRICE_BILLABLE_SESSION',
        data: { reason: params.reason, cost: params.cost },
      });

      billableServiceRepo.save(billableSession);
      return events;
    },

    releaseBillableSession(params: { sessionId: string }) {
      const billableSession = billableServiceRepo.getById(params.sessionId);

      const events = billableSession.run({
        type: 'RELEASE_BILLABLE_SESSION',
        data: {},
      });

      billableServiceRepo.save(billableSession);
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
