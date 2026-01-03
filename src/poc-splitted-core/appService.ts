import { getEvent, getEvents } from '../@utils/saga';
import type { PathType } from '../shared-types';
import type { createBookingService } from './booking/service';
import type { createClinicalService } from './clinical/service';
import type { ProfessionalRole } from './clinical/types';
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
      professionalRole: ProfessionalRole;
    }): Promise<{ pathId: string }> {
      const clinicalEvents = clinicalService.startPath({ patientId: params.patientId, pathType: params.pathType });
      const pathStartedEvent = getEvent(clinicalEvents, 'PATH_STARTED');

      clinicalService.addProfessional({
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
      clinicalService.addProfessional({
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
      const clinicalEvents = clinicalService.admitSession({
        patientId: params.patientId,
        pathId: params.pathId,
        startAt: params.startAt,
      });
      const sessionAdmittedEvent = getEvent(clinicalEvents, 'SESSION_ADMITTED');
      const sessionClassifiedEvents = getEvents(clinicalEvents, 'SESSION_CLASSIFIED');

      bookingService.scheduleEvent({
        patientId: params.patientId,
        startAt: params.startAt,
        eventId: sessionAdmittedEvent.data.id,
      });

      sessionClassifiedEvents.flatMap((sessionClassifiedEvent) =>
        economicsService.placeSessionOrder({
          patientId: params.patientId,
          sessionId: sessionClassifiedEvent.data.id,
          sessionNumber: sessionClassifiedEvent.data.number,
        }),
      );

      return { sessionId: sessionAdmittedEvent.data.id };
    },
    async rescheduleSession(params: { patientId: string; sessionId: string; startAt: Date }): Promise<void> {
      const clinicalEvents = clinicalService.reassessSession({
        patientId: params.patientId,
        startAt: params.startAt,
        sessionId: params.sessionId,
      });
      bookingService.rescheduleEvent({ eventId: params.sessionId, startAt: params.startAt });

      const sessionClassifiedEvents = getEvents(clinicalEvents, 'SESSION_CLASSIFIED');
      sessionClassifiedEvents.flatMap((sessionClassifiedEvent) =>
        economicsService.placeSessionOrder({
          patientId: params.patientId,
          sessionId: sessionClassifiedEvent.data.id,
          sessionNumber: sessionClassifiedEvent.data.number,
        }),
      );
    },
    async cancelSession(params: { patientId: string; sessionId: string }): Promise<void> {
      const clinicalEvents = clinicalService.revokeSession({
        patientId: params.patientId,
        sessionId: params.sessionId,
      });
      const sessionClassifiedEvents = getEvents(clinicalEvents, 'SESSION_CLASSIFIED');
      const sessionRevokedEvents = getEvents(clinicalEvents, 'SESSION_REVOKED');

      bookingService.cancelEvent({ eventId: params.sessionId });

      sessionClassifiedEvents.flatMap((sessionClassifiedEvent) =>
        economicsService.placeSessionOrder({
          patientId: params.patientId,
          sessionId: sessionClassifiedEvent.data.id,
          sessionNumber: sessionClassifiedEvent.data.number,
        }),
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
      const event = bookingService.getEvent(sessionId);

      const session = clinicalService.getSession(patientId, sessionId);
      const billableSession = economicsService.getSessionOrder(sessionId);
      if (!event || !session || !billableSession) throw new Error('Session not found');
      return { event, session, billableSession };
    },

    async getEvent(eventId: string) {
      return bookingService.getEvent(eventId);
    },
  };
}
