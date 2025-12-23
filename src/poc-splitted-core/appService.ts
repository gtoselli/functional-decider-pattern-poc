import { getEvent, getEvents } from '../@utils/saga';
import type { PathType } from '../shared-types';
import type { createBookingService } from './booking/service';
import type { createEconomicsService } from './economics/service';
import type { createClinicalInMemRepo } from './infra';

export function createAppService(
  economicsService: ReturnType<typeof createEconomicsService>,
  clinicalRepo: ReturnType<typeof createClinicalInMemRepo>,
  bookingService: ReturnType<typeof createBookingService>,
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
      const clinical = clinicalRepo.getById(params.patientId);

      const bookingEvents = bookingService.scheduleEvent({
        patientId: params.patientId,
        startAt: params.startAt,
      });
      const eventScheduledEvent = getEvent(bookingEvents, 'EVENT_SCHEDULED');

      const clinicalEvents = clinical.run({
        data: { id: eventScheduledEvent.data.id, startAt: eventScheduledEvent.data.startAt, pathId: params.pathId },
        type: 'ADMIT_SESSION',
      });
      const sessionClassifiedEvents = getEvents(clinicalEvents, 'SESSION_CLASSIFIED');

      sessionClassifiedEvents.flatMap((sessionClassifiedEvent) =>
        economicsService.placeSessionQuote({
          patientId: params.patientId,
          sessionId: sessionClassifiedEvent.data.id,
          sessionNumber: sessionClassifiedEvent.data.number,
        }),
      );

      clinicalRepo.save(clinical);

      return { sessionId: eventScheduledEvent.data.id };
    },
    async rescheduleSession(params: { patientId: string; sessionId: string; startAt: Date }): Promise<void> {
      const clinical = clinicalRepo.getById(params.patientId);

      const bookingEvents = bookingService.rescheduleEvent({ eventId: params.sessionId, startAt: params.startAt });
      const eventRescheduledEvent = getEvent(bookingEvents, 'EVENT_RESCHEDULED');

      const clinicalEvents = clinical.run({
        data: { id: params.sessionId, startAt: eventRescheduledEvent.data.startAt },
        type: 'REASSESS_SESSION',
      });
      const sessionClassifiedEvents = getEvents(clinicalEvents, 'SESSION_CLASSIFIED');

      sessionClassifiedEvents.flatMap((sessionClassifiedEvent) =>
        economicsService.placeSessionQuote({
          patientId: params.patientId,
          sessionId: sessionClassifiedEvent.data.id,
          sessionNumber: sessionClassifiedEvent.data.number,
        }),
      );

      clinicalRepo.save(clinical);
    },
    async cancelSession(params: { patientId: string; sessionId: string }): Promise<void> {
      const clinical = clinicalRepo.getById(params.patientId);

      bookingService.cancelEvent({ eventId: params.sessionId });

      const clinicalEvents = clinical.run({
        data: { id: params.sessionId },
        type: 'REVOKE_SESSION',
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

      clinicalRepo.save(clinical);
    },
    // async cancelPath(params: { patientId: string; pathId: string }): Promise<void> {},

    async getSession(patientId: string, sessionId: string) {
      const event = bookingService.getEvent(sessionId);
      const clinical = clinicalRepo.getById(patientId);

      const session = clinical
        .getState()
        .paths.flatMap((p) => p.sessions)
        .find((s) => s.id === sessionId);
      const billableSession = economicsService.getSessionQuote(sessionId);
      if (!event || !session || !billableSession) throw new Error('Session not found');
      return { event, session, billableSession };
    },

    async getEvent(eventId: string) {
      return bookingService.getEvent(eventId);
    },

    async getPath(patientId: string, pathId: string) {
      const clinical = clinicalRepo.getById(patientId).getState();

      return clinical.paths.find((p) => p.id === pathId);
    },
  };
}
