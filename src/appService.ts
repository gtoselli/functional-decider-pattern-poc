import { getEvent } from './@utils/events';
import type { BookingService } from './booking/service';
import type { ClinicalService } from './clinical/service';
import type { ProfessionalRole } from './clinical/types';
import type { EconomicsService } from './economics/service';
import type { PathType } from './shared-types';

export function createAppService(
  economicsService: EconomicsService,
  clinicalService: ClinicalService,
  bookingService: BookingService,
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
      const bookingEvents = await bookingService.scheduleEvent({
        patientId: params.patientId,
        startAt: params.startAt,
      });
      const eventScheduledEvent = getEvent(bookingEvents, 'EVENT_SCHEDULED');

      await clinicalService.addSession({
        patientId: params.patientId,
        pathId: params.pathId,
        startAt: params.startAt,
        eventId: eventScheduledEvent.data.id,
      });

      await economicsService.revisePatientEstimates({ patientId: params.patientId });

      return { sessionId: eventScheduledEvent.data.id };
    },
    async rescheduleSession(params: { patientId: string; sessionId: string; startAt: Date }): Promise<void> {
      await bookingService.rescheduleEvent({ eventId: params.sessionId, startAt: params.startAt });

      await clinicalService.reassessSession({
        patientId: params.patientId,
        startAt: params.startAt,
        sessionId: params.sessionId,
      });

      await economicsService.revisePatientEstimates({ patientId: params.patientId });
    },
    async cancelSession(params: { patientId: string; sessionId: string }): Promise<void> {
      const bookingEvents = await bookingService.cancelEvent({ eventId: params.sessionId });
      const eventCancelledEvent = getEvent(bookingEvents, 'EVENT_CANCELLED');

      await clinicalService.removeSession({
        patientId: params.patientId,
        sessionId: params.sessionId,
        reason: eventCancelledEvent.data.cancellationType === 'late' ? 'late_cancelled' : 'cancelled',
      });

      await economicsService.revisePatientEstimates({ patientId: params.patientId });
    },
    async markSessionAsNoShow(params: { patientId: string; sessionId: string }): Promise<void> {
      await bookingService.markEventAsNoShow({ eventId: params.sessionId });

      await clinicalService.removeSession({
        patientId: params.patientId,
        sessionId: params.sessionId,
        reason: 'no_show',
      });

      await economicsService.revisePatientEstimates({ patientId: params.patientId });
    },
    // async cancelPath(params: { patientId: string; pathId: string }): Promise<void> {},

    async getSession(patientId: string, sessionId: string) {
      const event = await bookingService.getEvent(sessionId);

      const session = await clinicalService.getSession(patientId, sessionId);
      const billableSession = await economicsService.getSessionPrice(patientId, sessionId);
      if (!event || !session || !billableSession) throw new Error('Session not found');
      return { event, session, billableSession };
    },

    async getEvent(eventId: string) {
      return bookingService.getEvent(eventId);
    },
  };
}
