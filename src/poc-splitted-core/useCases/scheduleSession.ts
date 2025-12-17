import type { Aggregate } from '../../@utils/decider';
import { executeSaga, getAllEventsByType, requireEvent, type SagaStep } from '../../@utils/saga';
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

const SCHEDULE_SESSION_SAGA: SagaStep<Actors, Params, Event>[] = [
  (_context, actors, params) => {
    return actors.booking.run({
      type: 'SCHEDULE_APPOINTMENT' as const,
      data: { startAt: params.startAt },
    });
  },

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

  (context, actors, _params) => {
    const sessionEvents = getAllEventsByType(context, 'SESSION_CLASSIFIED');
    return sessionEvents.flatMap((sessionEvent) => {
      return actors.economics.run({
        type: 'EVALUATE_PRICE' as const,
        data: {
          sessionId: sessionEvent.data.id,
          number: sessionEvent.data.number,
        },
      });
    });
  },
];
