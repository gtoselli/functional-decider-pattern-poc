import type { Aggregate } from '../../@utils/decider';
import { executeSaga, requireEvent, type SagaStep } from '../../@utils/saga';
import type { BookingDecider, Event as BookingEvent } from '../booking/types';
import type { ClinicalDecider, Event as ClinicalEvent } from '../clinical/types';
import type { EconomicsDecider, Event as EconomicsEvent } from '../economics/types';
import type { createBookingRepo, createClinicalRepo, createEconomicsRepo } from '../infra';

type Event = BookingEvent | ClinicalEvent | EconomicsEvent;

type Actors = {
  booking: Aggregate<BookingDecider>;
  clinical: Aggregate<ClinicalDecider>;
  economics: Aggregate<EconomicsDecider>;
};

type Params = { startAt: Date };

export function scheduleSessionUseCase(
  bookingRepo: ReturnType<typeof createBookingRepo>,
  clinicalRepo: ReturnType<typeof createClinicalRepo>,
  economicsRepo: ReturnType<typeof createEconomicsRepo>,
) {
  return {
    run(params: { patientId: string; startAt: Date }) {
      const booking = bookingRepo.getById(params.patientId);
      const clinical = clinicalRepo.getById(params.patientId);
      const economics = economicsRepo.getById(params.patientId);

      const result = executeSaga(SCHEDULE_SESSION_SAGA, { booking, clinical, economics }, { startAt: params.startAt });

      bookingRepo.save(booking);
      clinicalRepo.save(clinical);
      economicsRepo.save(economics);
      return result;
    },
  };
}

// Simplified saga - price evaluation happens automatically via PRICING_POLICY!
const SCHEDULE_SESSION_SAGA: SagaStep<Actors, Params, Event>[] = [
  // Step 1: Schedule appointment
  (_context, actors, params) => {
    return actors.booking.run({
      type: 'SCHEDULE_APPOINTMENT' as const,
      data: { startAt: params.startAt },
    });
  },

  // Step 2: Classify session
  // Note: Price evaluation happens automatically via PRICING_POLICY
  (context, actors, _params) => {
    const appointmentEvent = requireEvent(context, 'APPOINTMENT_SCHEDULED');
    return actors.clinical.run({
      type: 'CLASSIFY_SESSION' as const,
      data: {
        id: appointmentEvent.data.id,
        startAt: appointmentEvent.data.startAt,
      },
    });
  },

  // Step 3 removed! PRICING_POLICY automatically evaluates price when SESSION_CLASSIFIED is emitted
];
