import { beforeEach, it } from 'vitest';
import { clearPolicies } from '../../@utils/policy';
import { createBookingRepo, createClinicalRepo, createEconomicsRepo } from '../infra';
import { registerDomainPolicies } from '../registerPolicies';
import { scheduleSessionUseCase } from './scheduleSession';

const patientId = 'patient-id';

beforeEach(() => {
  // Clear and register policies before each test
  clearPolicies();
  registerDomainPolicies();
});

it('scheduleSession with automatic policies', () => {
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

  console.log('\n📋 Scheduling first session...');
  const result1 = scheduleSession.run({ patientId, startAt: new Date('2025-12-31') });
  console.log('Events:', result1.success ? result1.events.map((e) => e.type) : result1.error);

  console.log('\n📋 Scheduling second session...');
  const result2 = scheduleSession.run({ patientId, startAt: new Date('2025-12-30') });
  console.log('Events:', result2.success ? result2.events.map((e) => e.type) : result2.error);

  console.log('\n' + getAllStates());

  console.log('\n📋 Scheduling third session...');
  const result3 = scheduleSession.run({ patientId, startAt: new Date('2025-11-01') });
  console.log('Events:', result3.success ? result3.events.map((e) => e.type) : result3.error);

  console.log('\n' + getAllStates());
});
