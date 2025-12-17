import { it } from 'vitest';
import { createBookingRepo, createClinicalRepo, createEconomicsRepo } from '../infra';
import { scheduleSessionUseCase } from './scheduleSession';

const patientId = 'patient-id';

it('scheduleSession', () => {
  const bookingRepo = createBookingRepo();
  const clinicalRepo = createClinicalRepo();
  const economicsRepo = createEconomicsRepo();

  const getAllStates = () =>
    `All States\n` +
    JSON.stringify(
      [
        bookingRepo.getById(patientId).getState(),
        clinicalRepo.getById(patientId).getState(),
        economicsRepo.getById(patientId).getState(),
      ],
      null,
      2,
    );

  const scheduleSession = scheduleSessionUseCase(bookingRepo, clinicalRepo, economicsRepo);

  scheduleSession.run({ patientId, startAt: new Date('2025-12-31') });
  scheduleSession.run({ patientId, startAt: new Date('2025-12-30') });

  console.log(getAllStates());

  scheduleSession.run({ patientId, startAt: new Date('2025-11-01') });

  console.log(getAllStates());
});
