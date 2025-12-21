import { randomUUID } from 'node:crypto';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createBookingRepo, createClinicalRepo, createEconomicsRepo } from './infra';
import { createService } from './service';

describe('service', () => {
  const clinicalRepo = createClinicalRepo();
  const economicsRepo = createEconomicsRepo();
  const bookingRepo = createBookingRepo();
  const service = createService(economicsRepo, clinicalRepo, bookingRepo);

  let patientId: string;
  beforeEach(() => {
    patientId = randomUUID();
  });

  describe('scheduleSession', () => {
    const startAt = new Date('2026-01-01');

    it('should create session', async () => {
      const res = await service.scheduleSession({ patientId, startAt });

      const session = await service.getSession(patientId, res.sessionId);
      expect(session).toEqual({
        event: {
          id: expect.any(String),
          startAt,
          cancelledAt: null,
        },
        session: {
          id: expect.any(String),
          startAt,
          number: 1,
        },
        price: {
          id: expect.any(String),
          cost: 0,
          reason: 'first_session',
          status: 'quoted',
        },
      });
    });
  });

  describe('rescheduleSession', () => {
    let sessionId: string;
    const startAt = new Date('2025-12-31');

    beforeEach(async () => {
      const res = await service.scheduleSession({ patientId, startAt: new Date('2026-01-01') });
      sessionId = res.sessionId;
    });

    it('should reschedule session', async () => {
      await service.rescheduleSession({ sessionId, patientId, startAt });

      const session = await service.getSession(patientId, sessionId);
      expect(session).toEqual({
        event: {
          id: expect.any(String),
          startAt,
          cancelledAt: null,
        },
        session: {
          id: expect.any(String),
          startAt,
          number: 1,
        },
        price: {
          id: expect.any(String),
          cost: 0,
          reason: 'first_session',
          status: 'quoted',
        },
      });
    });
  });

  describe('cancelSession', () => {
    let sessionId: string;
    beforeEach(async () => {
      const res = await service.scheduleSession({ patientId, startAt: new Date('2026-01-01') });
      sessionId = res.sessionId;
    });

    it('should cancel session', async () => {
      await service.cancelSession({ sessionId, patientId });

      const session = await service.getSession(patientId, sessionId);
      expect(session).toEqual({
        event: {
          id: expect.any(String),
          startAt: expect.any(Date),
          cancelledAt: expect.any(Date),
        },
        session: {
          id: expect.any(String),
          startAt: expect.any(Date),
          number: 1,
          revokedAt: expect.any(Date),
        },
        price: {
          id: expect.any(String),
          cost: 0,
          reason: 'first_session',
          status: 'released',
        },
      });
    });
  });
});
