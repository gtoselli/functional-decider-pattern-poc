import { randomUUID } from 'node:crypto';
import type { createBookingInMemRepo } from '../infra';
import { decide } from './decide';
import { evolve } from './evolve';

export function createBookingService(repo: ReturnType<typeof createBookingInMemRepo>) {
  return {
    async scheduleEvent(params: { patientId: string; startAt: Date }) {
      const eventId = randomUUID();
      const state = await repo.getById(eventId);

      const events = decide(
        {
          type: 'SCHEDULE_EVENT',
          data: { startAt: params.startAt, patientId: params.patientId },
        },
        state,
      );

      await repo.save(events.reduce(evolve, state));
      return events;
    },

    async rescheduleEvent(params: { eventId: string; startAt: Date }) {
      const state = await repo.getById(params.eventId);

      const events = decide(
        {
          type: 'RESCHEDULE_EVENT',
          data: { startAt: params.startAt },
        },
        state,
      );

      await repo.save(events.reduce(evolve, state));
      return events;
    },

    async cancelEvent(params: { eventId: string }) {
      const state = await repo.getById(params.eventId);

      const events = decide(
        {
          type: 'CANCEL_EVENT',
          data: {},
        },
        state,
      );

      await repo.save(events.reduce(evolve, state));
      return events;
    },

    async markEventAsNoShow(params: { eventId: string }) {
      const state = await repo.getById(params.eventId);

      const events = decide(
        {
          type: 'MARK_AS_NO_SHOW',
          data: {},
        },
        state,
      );

      await repo.save(events.reduce(evolve, state));
      return events;
    },

    async getEvent(eventId: string) {
      return await repo.getById(eventId);
    },
  };
}

export type BookingService = ReturnType<typeof createBookingService>;
