import type { createBookingInMemRepo } from '../infra';

export function createBookingService(bookingRepo: ReturnType<typeof createBookingInMemRepo>) {
  return {
    async scheduleEvent(params: { patientId: string; startAt: Date; eventId: string }) {
      const event = await bookingRepo.getById(params.eventId);

      const events = event.run({
        type: 'SCHEDULE_EVENT',
        data: { startAt: params.startAt, patientId: params.patientId },
      });

      await bookingRepo.save(event);
      return events;
    },

    async rescheduleEvent(params: { eventId: string; startAt: Date }) {
      const event = await bookingRepo.getById(params.eventId);

      const events = event.run({
        type: 'RESCHEDULE_EVENT',
        data: { startAt: params.startAt },
      });

      await bookingRepo.save(event);
      return events;
    },

    async cancelEvent(params: { eventId: string }) {
      const event = await bookingRepo.getById(params.eventId);

      const events = event.run({
        type: 'CANCEL_EVENT',
        data: {},
      });

      await bookingRepo.save(event);
      return events;
    },

    async getEvent(eventId: string) {
      return (await bookingRepo.getById(eventId)).getState();
    },
  };
}

export type BookingService = ReturnType<typeof createBookingService>;
