import { getEvent, getEvents } from '../@utils/saga';
import type { PathType } from '../shared-types';
import type { createBookingRepo, createClinicalRepo, createEconomicsRepo } from './infra';

export function createService(
  economicsRepo: ReturnType<typeof createEconomicsRepo>,
  clinicalRepo: ReturnType<typeof createClinicalRepo>,
  bookingRepo: ReturnType<typeof createBookingRepo>,
) {
  return {
    async startPath(params: {
      patientId: string;
      pathType: PathType;
      professionalId: string;
    }): Promise<{ pathId: string }> {
      const clinical = clinicalRepo.getById(params.patientId);

      const clinicalEvents = clinical.run({
        data: { pathType: params.pathType },
        type: 'START_PATH',
      });
      const pathStartedEvent = getEvent(clinicalEvents, 'PATH_STARTED');
      clinical.run({
        data: { professionalId: params.professionalId, pathId: pathStartedEvent.data.id },
        type: 'ADD_PROFESSIONAL',
      });

      clinicalRepo.save(clinical);

      return { pathId: pathStartedEvent.data.id };
    },

    async scheduleSession(params: {
      patientId: string;
      startAt: Date;
      pathId: string;
    }): Promise<{ sessionId: string }> {
      const booking = bookingRepo.getById(params.patientId);
      const clinical = clinicalRepo.getById(params.patientId);
      const economics = economicsRepo.getById(params.patientId);

      const bookingEvents = booking.run({
        type: 'SCHEDULE_EVENT',
        data: { startAt: params.startAt },
      });
      const eventScheduledEvent = getEvent(bookingEvents, 'EVENT_SCHEDULED');

      const clinicalEvents = clinical.run({
        data: { id: eventScheduledEvent.data.id, startAt: eventScheduledEvent.data.startAt, pathId: params.pathId },
        type: 'ADMIT_SESSION',
      });
      const sessionClassifiedEvents = getEvents(clinicalEvents, 'SESSION_CLASSIFIED');

      const _economicsEvents = sessionClassifiedEvents.flatMap((sessionClassifiedEvent) =>
        economics.run({
          data: { sessionId: sessionClassifiedEvent.data.id, number: sessionClassifiedEvent.data.number },
          type: 'QUOTE_SERVICE',
        }),
      );

      bookingRepo.save(booking);
      clinicalRepo.save(clinical);
      economicsRepo.save(economics);

      return { sessionId: eventScheduledEvent.data.id };
    },
    async rescheduleSession(params: { patientId: string; sessionId: string; startAt: Date }): Promise<void> {
      const booking = bookingRepo.getById(params.patientId);
      const clinical = clinicalRepo.getById(params.patientId);
      const economics = economicsRepo.getById(params.patientId);

      const bookingEvents = booking.run({
        type: 'RESCHEDULE_EVENT',
        data: { id: params.sessionId, startAt: params.startAt },
      });
      const eventRescheduledEvent = getEvent(bookingEvents, 'EVENT_RESCHEDULED');

      const clinicalEvents = clinical.run({
        data: { id: eventRescheduledEvent.data.id, startAt: eventRescheduledEvent.data.startAt },
        type: 'REASSESS_SESSION',
      });
      const sessionClassifiedEvents = getEvents(clinicalEvents, 'SESSION_CLASSIFIED');

      const _economicsEvents = sessionClassifiedEvents.flatMap((sessionClassifiedEvent) =>
        economics.run({
          data: { sessionId: sessionClassifiedEvent.data.id, number: sessionClassifiedEvent.data.number },
          type: 'QUOTE_SERVICE',
        }),
      );

      bookingRepo.save(booking);
      clinicalRepo.save(clinical);
      economicsRepo.save(economics);
    },
    async cancelSession(params: { patientId: string; sessionId: string }): Promise<void> {
      const booking = bookingRepo.getById(params.patientId);
      const clinical = clinicalRepo.getById(params.patientId);
      const economics = economicsRepo.getById(params.patientId);

      const bookingEvents = booking.run({
        type: 'CANCEL_EVENT',
        data: { id: params.sessionId },
      });
      const eventsScheduledEvent = getEvent(bookingEvents, 'EVENT_CANCELLED');

      const clinicalEvents = clinical.run({
        data: { id: eventsScheduledEvent.data.id },
        type: 'REVOKE_SESSION',
      });
      const sessionClassifiedEvents = getEvents(clinicalEvents, 'SESSION_CLASSIFIED');
      const sessionRevokedEvents = getEvents(clinicalEvents, 'SESSION_REVOKED');

      sessionClassifiedEvents.forEach((sessionClassifiedEvent) => {
        economics.run({
          data: { sessionId: sessionClassifiedEvent.data.id, number: sessionClassifiedEvent.data.number },
          type: 'QUOTE_SERVICE',
        });
      });
      sessionRevokedEvents.forEach((sessionRevokedEvent) => {
        economics.run({
          data: { sessionId: sessionRevokedEvent.data.id },
          type: 'RELEASE_QUOTE',
        });
      });

      bookingRepo.save(booking);
      clinicalRepo.save(clinical);
      economicsRepo.save(economics);
    },
    // async startPath(params: { patientId: string; pathType: PathType }): Promise<{ pathId: string }> {},
    // async cancelPath(params: { patientId: string; pathId: string }): Promise<void> {},

    async getSession(patientId: string, sessionId: string) {
      const booking = bookingRepo.getById(patientId);
      const clinical = clinicalRepo.getById(patientId);
      const economics = economicsRepo.getById(patientId);

      const event = booking.getState().events.find((a) => a.id === sessionId);
      const session = clinical
        .getState()
        .paths.flatMap((p) => p.sessions)
        .find((s) => s.id === sessionId);
      const price = economics.getState().prices.find((s) => s.id === sessionId);
      if (!event || !session || !price) throw new Error('Session not found');
      return { event, session, price };
    },

    async getEvent(patientId: string, eventId: string) {
      const booking = bookingRepo.getById(patientId).getState();

      return booking.events.find((e) => e.id === eventId);
    },

    async getPath(patientId: string, pathId: string) {
      const clinical = clinicalRepo.getById(patientId).getState();

      return clinical.paths.find((p) => p.id === pathId);
    },
  };
}
