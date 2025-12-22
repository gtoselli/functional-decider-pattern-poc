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
    it('should start path in clinical context', async () => {
      const { pathId } = await service.startPath({ patientId, pathType: 'wlm', professionalId });

      expect(clinicalRepo.getById(patientId).getState()).toEqual({
        id: patientId,
        paths: [
          {
            id: pathId,
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
      const { sessionId } = await service.scheduleSession({ patientId, startAt, pathId });

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
          revokedAt: null,
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
      const { pathId } = await service.startPath({ patientId, pathType: 'wlm', professionalId });
      const res = await service.scheduleSession({ patientId, startAt: new Date('2026-01-01'), pathId: pathId });
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
          revokedAt: null,
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
    let pathId: string;
    let sessionId: string;
    beforeEach(async () => {
      const pathRes = await service.startPath({ patientId, pathType: 'wlm', professionalId });
      pathId = pathRes.pathId;
      const res = await service.scheduleSession({ patientId, startAt: new Date('2026-01-01'), pathId });
      sessionId = res.sessionId;
      await service.scheduleSession({ patientId, startAt: new Date('2026-01-02'), pathId });
      await service.scheduleSession({ patientId, startAt: new Date('2026-01-03'), pathId });

      await service.cancelSession({ sessionId, patientId });
    });

    it('should cancel event in booking context', async () => {
      expect(await service.getEvent(patientId, sessionId)).toMatchObject({
        cancelledAt: expect.any(Date),
      });
    });

    it('should revoke session in clinical context', async () => {
      expect(await service.getPath(patientId, pathId)).toMatchObject({
        sessions: expect.arrayContaining([expect.objectContaining({ id: sessionId, revokedAt: expect.any(Date) })]),
      });
    });

    it('should reassess path sequence in clinical context', async () => {
      expect(await service.getPath(patientId, pathId)).toMatchObject({
        sessions: [{ id: sessionId, number: 1 }, { number: 1 }, { number: 2 }],
      });
    });

    it('should release quote in economics context', async () => {
      expect(economicsRepo.getById(patientId).getState()).toMatchObject({
        prices: expect.arrayContaining([expect.objectContaining({ id: sessionId, status: 'released' })]),
      });
    });

    it('should re quote other prices in economics context', async () => {
      expect(economicsRepo.getById(patientId).getState()).toMatchObject({
        prices: [
          { id: sessionId, status: 'released', cost: 0 },
          { status: 'quoted', cost: 0 },
          { status: 'quoted', cost: 4500 },
        ],
      });
    });
  });
});
