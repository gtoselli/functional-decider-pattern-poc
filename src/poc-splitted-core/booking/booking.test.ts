import { beforeEach, describe, expect, it } from 'vitest';
import { createDeciderAggregate } from '../../@utils/decider';
import { bookingDecider } from './index';
import type { State } from './types';

describe('bookingDecider', () => {
  const id = 'foo-patient-id';
  const INITIAL_STATE = { id, appointments: [] } satisfies State;
  const aggregate = createDeciderAggregate(bookingDecider, INITIAL_STATE);

  beforeEach(() => {
    aggregate.resetToInitialState();
  });

  it('schedule appointment', () => {
    const events = aggregate.run({ type: 'SCHEDULE_APPOINTMENT', data: { startAt: new Date('2000-07-01') } });

    expect(events).toEqual([
      {
        data: {
          id: expect.any(String),
          startAt: new Date('2000-07-01'),
        },
        type: 'APPOINTMENT_SCHEDULED',
      },
    ]);
    expect(aggregate.getState()).toEqual({
      appointments: [
        {
          cancelledAt: null,
          id: expect.any(String),
          startAt: new Date('2000-07-01'),
        },
      ],
      id,
    });
  });

  it('rescheduled appointment', () => {
    const originalStartAt = new Date('2000-07-01');
    aggregate.run({ type: 'SCHEDULE_APPOINTMENT', data: { startAt: originalStartAt } });

    const events = aggregate.run({
      type: 'RESCHEDULE_APPOINTMENT',
      data: { id: aggregate.getState()['appointments'][0].id, startAt: new Date('2000-07-02') },
    });

    expect(events).toEqual([
      {
        data: {
          id: expect.any(String),
          startAt: new Date('2000-07-02'),
        },
        type: 'APPOINTMENT_RESCHEDULED',
      },
    ]);
    expect(aggregate.getState()).toEqual({
      appointments: [
        {
          cancelledAt: null,
          id: expect.any(String),
          startAt: new Date('2000-07-02'),
        },
      ],
      id,
    });
  });

  it('cancel appointment', () => {
    aggregate.run({ type: 'SCHEDULE_APPOINTMENT', data: { startAt: new Date('2000-07-01') } });

    const events = aggregate.run({
      type: 'CANCEL_APPOINTMENT',
      data: { id: aggregate.getState()['appointments'][0].id },
    });

    expect(events).toEqual([
      {
        data: {
          id: expect.any(String),
          cancelledAt: expect.any(Date),
          startAt: expect.any(Date),
        },
        type: 'APPOINTMENT_CANCELLED',
      },
    ]);
    expect(aggregate.getState()).toEqual({
      appointments: [
        {
          cancelledAt: expect.any(Date),
          id: expect.any(String),
          startAt: new Date('2000-07-01'),
        },
      ],
      id,
    });
  });
});
