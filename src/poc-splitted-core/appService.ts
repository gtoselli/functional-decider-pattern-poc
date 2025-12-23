import { getEvent, getEvents } from '../@utils/saga';
import type { PathType } from '../shared-types';
import type { createBookingService } from './booking/service';
import type { createClinicalService } from './clinical/service';
import type { createEconomicsService } from './economics/service';

export function createAppService(
  economicsService: ReturnType<typeof createEconomicsService>,
  clinicalService: ReturnType<typeof createClinicalService>,
  bookingService: ReturnType<typeof createBookingService>,
) {
  return {
    async startPath(params: {
      patientId: string;
      pathType: PathType;
      professionalId: string;
    }): Promise<{ pathId: string }> {
      const clinicalEvents = clinicalService.startPath({ patientId: params.patientId, pathType: params.pathType });
      const pathStartedEvent = getEvent(clinicalEvents, 'PATH_STARTED');

      clinicalService.addProfessional({
        patientId: params.patientId,
        professionalId: params.professionalId,
        pathId: pathStartedEvent.data.id,
      });

      return { pathId: pathStartedEvent.data.id };
    },

    async scheduleSession(params: {
      patientId: string;
      startAt: Date;
      pathId: string;
    }): Promise<{ sessionId: string }> {
      const bookingEvents = bookingService.scheduleEvent({
        patientId: params.patientId,
        startAt: params.startAt,
      });
      const eventScheduledEvent = getEvent(bookingEvents, 'EVENT_SCHEDULED');

      const clinicalEvents = clinicalService.admitSession({
        patientId: params.patientId,
        pathId: params.pathId,
        sessionId: eventScheduledEvent.data.id,
        startAt: eventScheduledEvent.data.startAt,
      });
      const sessionClassifiedEvents = getEvents(clinicalEvents, 'SESSION_CLASSIFIED');

      sessionClassifiedEvents.flatMap((sessionClassifiedEvent) =>
        economicsService.placeSessionQuote({
          patientId: params.patientId,
          sessionId: sessionClassifiedEvent.data.id,
          sessionNumber: sessionClassifiedEvent.data.number,
        }),
      );

      return { sessionId: eventScheduledEvent.data.id };
    },
    async rescheduleSession(params: { patientId: string; sessionId: string; startAt: Date }): Promise<void> {
      const bookingEvents = bookingService.rescheduleEvent({ eventId: params.sessionId, startAt: params.startAt });
      const eventRescheduledEvent = getEvent(bookingEvents, 'EVENT_RESCHEDULED');

      const clinicalEvents = clinicalService.reassessSession({
        patientId: params.patientId,
        startAt: eventRescheduledEvent.data.startAt,
        sessionId: params.sessionId,
      });
      const sessionClassifiedEvents = getEvents(clinicalEvents, 'SESSION_CLASSIFIED');

      sessionClassifiedEvents.flatMap((sessionClassifiedEvent) =>
        economicsService.placeSessionQuote({
          patientId: params.patientId,
          sessionId: sessionClassifiedEvent.data.id,
          sessionNumber: sessionClassifiedEvent.data.number,
        }),
      );
    },
    async cancelSession(params: { patientId: string; sessionId: string }): Promise<void> {
      bookingService.cancelEvent({ eventId: params.sessionId });

      const clinicalEvents = clinicalService.revokeSession({
        patientId: params.patientId,
        sessionId: params.sessionId,
      });
      const sessionClassifiedEvents = getEvents(clinicalEvents, 'SESSION_CLASSIFIED');
      const sessionRevokedEvents = getEvents(clinicalEvents, 'SESSION_REVOKED');

      sessionClassifiedEvents.flatMap((sessionClassifiedEvent) =>
        economicsService.placeSessionQuote({
          patientId: params.patientId,
          sessionId: sessionClassifiedEvent.data.id,
          sessionNumber: sessionClassifiedEvent.data.number,
        }),
      );

      sessionRevokedEvents.flatMap((sessionRevokedEvent) =>
        economicsService.voidSessionQuote({
          patientId: params.patientId,
          sessionId: sessionRevokedEvent.data.id,
        }),
      );
    },
    // async cancelPath(params: { patientId: string; pathId: string }): Promise<void> {},

    async getSession(patientId: string, sessionId: string) {
      const event = bookingService.getEvent(sessionId);

      const session = clinicalService.getSession(patientId, sessionId);
      const billableSession = economicsService.getSessionQuote(sessionId);
      if (!event || !session || !billableSession) throw new Error('Session not found');
      return { event, session, billableSession };
    },

    async getEvent(eventId: string) {
      return bookingService.getEvent(eventId);
    },
  };
}
