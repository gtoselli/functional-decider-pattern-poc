import type { createBookingInMemRepo } from '../infra';

export function createBookingService(bookingRepo: ReturnType<typeof createBookingInMemRepo>) {
  return {
    scheduleEvent(params: { patientId: string; startAt: Date; eventId: string }) {
      const event = bookingRepo.getById(params.eventId);

      const events = event.run({
        type: 'SCHEDULE_EVENT',
        data: { startAt: params.startAt, patientId: params.patientId },
      });

      bookingRepo.save(event);
      return events;
    },

    rescheduleEvent(params: { eventId: string; startAt: Date }) {
      const event = bookingRepo.getById(params.eventId);

      const events = event.run({
        type: 'RESCHEDULE_EVENT',
        data: { startAt: params.startAt },
      });

      bookingRepo.save(event);
      return events;
    },

    cancelEvent(params: { eventId: string }) {
      const event = bookingRepo.getById(params.eventId);

      const events = event.run({
        type: 'CANCEL_EVENT',
        data: {},
      });

      bookingRepo.save(event);
      return events;
    },

    getEvent(eventId: string) {
      return bookingRepo.getById(eventId).getState();
    },
  };
}
