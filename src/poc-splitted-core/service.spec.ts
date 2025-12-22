import { randomUUID } from 'node:crypto';
import { beforeEach, describe, expect, it } from 'vitest';
import { createBookingRepo, createClinicalRepo, createEconomicsRepo } from './infra';
import { createService } from './service';

describe('service', () => {
  const clinicalRepo = createClinicalRepo();
  const economicsRepo = createEconomicsRepo();
  const bookingRepo = createBookingRepo();
  const service = createService(economicsRepo, clinicalRepo, bookingRepo);

  let patientId: string;
  let professionalId: string;
  beforeEach(() => {
    patientId = randomUUID();
    professionalId = randomUUID();
  });

  describe('startPath', () => {
    it('should start path', async () => {
      const res = await service.startPath({ patientId, pathType: 'wlm', professionalId });

      expect(clinicalRepo.getById(patientId).getState()).toEqual({
        id: patientId,
        paths: [
          {
            id: res.pathId,
            professionals: [{ id: professionalId, addedAt: expect.any(Date) }],
            sessions: [],
            startedAt: expect.any(Date),
            type: 'wlm',
          },
        ],
      });
    });
  });

  describe('scheduleSession', () => {
    let pathId: string;
    const startAt = new Date('2026-01-01');

    beforeEach(async () => {
      const res = await service.startPath({ patientId, pathType: 'wlm', professionalId });
      pathId = res.pathId;
    });

    it('should create session', async () => {
      const res = await service.scheduleSession({ patientId, startAt, pathId });

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
      const pathRes = await service.startPath({ patientId, pathType: 'wlm', professionalId });
      const res = await service.scheduleSession({ patientId, startAt: new Date('2026-01-01'), pathId: pathRes.pathId });
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
      const pathRes = await service.startPath({ patientId, pathType: 'wlm', professionalId });
      const res = await service.scheduleSession({ patientId, startAt: new Date('2026-01-01'), pathId: pathRes.pathId });
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
