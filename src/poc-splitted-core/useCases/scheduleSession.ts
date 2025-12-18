import { executeSaga, requireEvent, type SagaStep } from '../../@utils/saga';
import type { Event as BookingEvent } from '../booking/types';
import type { Event as ClinicalEvent } from '../clinical/types';
import type { Event as EconomicsEvent } from '../economics/types';
import type { createBookingRepo, createClinicalRepo, createEconomicsRepo } from '../infra';

type Event = BookingEvent | ClinicalEvent | EconomicsEvent;

type Dependencies = {
  booking: ReturnType<typeof createBookingRepo>;
  clinical: ReturnType<typeof createClinicalRepo>;
  economics: ReturnType<typeof createEconomicsRepo>;
};

type Params = { patientId: string; startAt: Date };

export function scheduleSessionUseCase(
  bookingRepo: ReturnType<typeof createBookingRepo>,
  clinicalRepo: ReturnType<typeof createClinicalRepo>,
  economicsRepo: ReturnType<typeof createEconomicsRepo>,
) {
  return {
    run(params: { patientId: string; startAt: Date }) {
      const dependencies: Dependencies = {
        booking: bookingRepo,
        clinical: clinicalRepo,
        economics: economicsRepo,
      };

      return executeSaga(SCHEDULE_SESSION_SAGA, dependencies, params);
    },
  };
}

const SCHEDULE_SESSION_SAGA: SagaStep<Dependencies, Params, Event>[] = [
  // Step 1: Schedule appointment
  (_context, deps, params) => {
    const booking = deps.booking.getById(params.patientId);
    const events = booking.run({
      type: 'SCHEDULE_APPOINTMENT' as const,
      data: { startAt: params.startAt },
    });
    deps.booking.save(booking);
    return events;
  },

  // Note: Price evaluation happens automatically via PRICING_POLICY
  (context, deps, params) => {
    const appointmentEvent = requireEvent(context, 'APPOINTMENT_SCHEDULED');
    const clinical = deps.clinical.getById(params.patientId);
    const events = clinical.run({
      type: 'CLASSIFY_SESSION' as const,
      data: {
        id: appointmentEvent.data.id,
        startAt: appointmentEvent.data.startAt,
      },
    });
    deps.clinical.save(clinical);
    return events;
  },
];
