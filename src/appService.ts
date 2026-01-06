import { getEvent, getEvents } from './@utils/events';
import type { createBookingService } from './booking/service';
import type { createClinicalService } from './clinical/service';
import type { ProfessionalRole } from './clinical/types';
import type { createEconomicsService } from './economics/service';
import type { PathType } from './shared-types';

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
      professionalRole: ProfessionalRole;
    }): Promise<{ pathId: string }> {
      const clinicalEvents = await clinicalService.startPath({
        patientId: params.patientId,
        pathType: params.pathType,
      });
      const pathStartedEvent = getEvent(clinicalEvents, 'PATH_STARTED');

      await clinicalService.addProfessional({
        patientId: params.patientId,
        professionalId: params.professionalId,
        pathId: pathStartedEvent.data.id,
        role: params.professionalRole,
      });

      return { pathId: pathStartedEvent.data.id };
    },
    async addProfessional(params: {
      patientId: string;
      pathId: string;
      professionalId: string;
      role: ProfessionalRole;
    }) {
      await clinicalService.addProfessional({
        patientId: params.patientId,
        pathId: params.pathId,
        professionalId: params.professionalId,
        role: params.role,
      });
    },
    async scheduleSession(params: {
      patientId: string;
      startAt: Date;
      pathId: string;
    }): Promise<{ sessionId: string }> {
      const clinicalEvents = await clinicalService.addSession({
        patientId: params.patientId,
        pathId: params.pathId,
        startAt: params.startAt,
      });
      const sessionAddedEvent = getEvent(clinicalEvents, 'SESSION_ADDED');
      const sessionClassifiedEvents = getEvents(clinicalEvents, 'SESSION_CLASSIFIED');

      await bookingService.scheduleEvent({
        patientId: params.patientId,
        startAt: params.startAt,
        eventId: sessionAddedEvent.data.id,
      });

      await Promise.all(
        sessionClassifiedEvents.flatMap((sessionClassifiedEvent) =>
          economicsService.placeSessionOrder({
            patientId: params.patientId,
            sessionId: sessionClassifiedEvent.data.id,
            sessionNumber: sessionClassifiedEvent.data.number,
          }),
        ),
      );

      return { sessionId: sessionAddedEvent.data.id };
    },
    async rescheduleSession(params: { patientId: string; sessionId: string; startAt: Date }): Promise<void> {
      const clinicalEvents = await clinicalService.reassessSession({
        patientId: params.patientId,
        startAt: params.startAt,
        sessionId: params.sessionId,
      });
      await bookingService.rescheduleEvent({ eventId: params.sessionId, startAt: params.startAt });

      const sessionClassifiedEvents = getEvents(clinicalEvents, 'SESSION_CLASSIFIED');
      await Promise.all(
        sessionClassifiedEvents.flatMap((sessionClassifiedEvent) =>
          economicsService.placeSessionOrder({
            patientId: params.patientId,
            sessionId: sessionClassifiedEvent.data.id,
            sessionNumber: sessionClassifiedEvent.data.number,
          }),
        ),
      );
    },
    async cancelSession(params: { patientId: string; sessionId: string }): Promise<void> {
      const clinicalEvents = await clinicalService.removeSession({
        patientId: params.patientId,
        sessionId: params.sessionId,
      });
      const sessionClassifiedEvents = getEvents(clinicalEvents, 'SESSION_CLASSIFIED');
      const sessionRevokedEvents = getEvents(clinicalEvents, 'SESSION_REMOVED');

      await bookingService.cancelEvent({ eventId: params.sessionId });

      await Promise.all(
        sessionClassifiedEvents.flatMap((sessionClassifiedEvent) =>
          economicsService.placeSessionOrder({
            patientId: params.patientId,
            sessionId: sessionClassifiedEvent.data.id,
            sessionNumber: sessionClassifiedEvent.data.number,
          }),
        ),
      );

      sessionRevokedEvents.flatMap((sessionRevokedEvent) =>
        economicsService.voidSessionOrder({
          patientId: params.patientId,
          sessionId: sessionRevokedEvent.data.id,
        }),
      );
    },
    // async cancelPath(params: { patientId: string; pathId: string }): Promise<void> {},

    async getSession(patientId: string, sessionId: string) {
      const event = await bookingService.getEvent(sessionId);

      const session = await clinicalService.getSession(patientId, sessionId);
      const billableSession = await economicsService.getSessionOrder(sessionId);
      if (!event || !session || !billableSession) throw new Error('Session not found');
      return { event, session, billableSession };
    },

    async getEvent(eventId: string) {
      return bookingService.getEvent(eventId);
    },
  };
}
