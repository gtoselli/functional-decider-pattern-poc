import { randomUUID } from 'node:crypto';
import { beforeEach, describe, expect, it } from 'vitest';
import { createBillableSessionService } from './billableSession/service';
import { createBookingService } from './booking/service';
import {
  createBillableSessionInMemRepo,
  createBookingInMemRepo,
  createClinicalInMemRepo,
  createEconomicsInMemRepo,
} from './infra';
import { createService } from './service';

describe('service', () => {
  const clinicalRepo = createClinicalInMemRepo();
  const economicsRepo = createEconomicsInMemRepo();
  const bookingService = createBookingService(createBookingInMemRepo());
  const billableSessionService = createBillableSessionService(createBillableSessionInMemRepo());
  const service = createService(economicsRepo, clinicalRepo, bookingService, billableSessionService);

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
    let sessionId: string;
    const startAt = new Date('2026-01-01');

    beforeEach(async () => {
      const pathRes = await service.startPath({ patientId, pathType: 'wlm', professionalId });
      pathId = pathRes.pathId;

      const res = await service.scheduleSession({ patientId, startAt, pathId });
      sessionId = res.sessionId;
    });

    it('should schedule event in booking context', async () => {
      expect(bookingService.getEvent(sessionId)).toMatchObject({ id: sessionId, startAt });
    });

    it('should admit and classify session in clinical context', async () => {
      expect(await service.getPath(patientId, pathId)).toMatchObject({
        sessions: [
          {
            id: sessionId,
            startAt: expect.any(Date),
            number: 1,
            revokedAt: null,
          },
        ],
      });
    });

    it('should quote price in economics context', async () => {
      expect(billableSessionService.getBillingSession(sessionId)).toMatchObject({
        id: sessionId,
        cost: 0,
        reason: 'first_session',
      });
    });

    it('should create session', async () => {
      const session = await service.getSession(patientId, sessionId);
      expect(session).toMatchObject({
        event: {
          id: expect.any(String),
          startAt,
          cancelledAt: null,
          patientId,
        },
        session: {
          id: expect.any(String),
          startAt,
          number: 1,
          revokedAt: null,
        },
        billableSession: {
          id: expect.any(String),
          cost: 0,
          reason: 'first_session',
        },
      });
    });
  });

  describe('rescheduleSession', () => {
    let pathId: string;
    let sessionId: string;
    const startAt = new Date('2026-01-04');

    beforeEach(async () => {
      const pathRes = await service.startPath({ patientId, pathType: 'wlm', professionalId });
      pathId = pathRes.pathId;
      const res = await service.scheduleSession({ patientId, startAt: new Date('2026-01-01'), pathId: pathId });
      sessionId = res.sessionId;
      await service.scheduleSession({ patientId, startAt: new Date('2026-01-02'), pathId });
      await service.scheduleSession({ patientId, startAt: new Date('2026-01-03'), pathId });

      await service.rescheduleSession({ sessionId, patientId, startAt });
    });

    it('should reschedule event in booking context', async () => {
      expect(bookingService.getEvent(sessionId)).toMatchObject({ startAt });
    });

    it('should re classify path sessions in clinical context', async () => {
      expect(await service.getPath(patientId, pathId)).toMatchObject({
        sessions: [{ id: sessionId, number: 3 }, { number: 1 }, { number: 2 }],
      });
    });

    it('should re quote other prices in economics context', async () => {
      expect(billableSessionService.getBillingSessions(patientId)).toEqual([
        expect.objectContaining({ id: sessionId, cost: 4500, releasedAt: null }),
        expect.objectContaining({ cost: 0, releasedAt: null }),
        expect.objectContaining({ cost: 4500, releasedAt: null }),
      ]);
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
      expect(bookingService.getEvent(sessionId)).toMatchObject({
        cancelledAt: expect.any(Date),
      });
    });

    it('should revoke session in clinical context', async () => {
      expect(await service.getPath(patientId, pathId)).toMatchObject({
        sessions: expect.arrayContaining([expect.objectContaining({ id: sessionId, revokedAt: expect.any(Date) })]),
      });
    });

    it('should re classify path sessions in clinical context', async () => {
      expect(await service.getPath(patientId, pathId)).toMatchObject({
        sessions: [{ id: sessionId, number: 1 }, { number: 1 }, { number: 2 }],
      });
    });

    it('should release quote in economics context', async () => {
      expect(billableSessionService.getBillingSession(sessionId)).toMatchObject({ releasedAt: expect.any(Date) });
    });

    it('should re quote other prices in economics context', async () => {
      expect(billableSessionService.getBillingSessions(patientId)).toEqual([
        expect.objectContaining({ id: sessionId, cost: 0, releasedAt: expect.any(Date) }),
        expect.objectContaining({ cost: 0 }),
        expect.objectContaining({ cost: 4500 }),
      ]);
    });
  });
});
