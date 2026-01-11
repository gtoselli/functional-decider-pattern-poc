import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createDeciderAggregate } from '../@utils/decider';
import { bookingDecider } from './index';
import type { State } from './types';

describe('bookingDecider', () => {
  const id = 'event-id';
  const patientId = 'foo-patient-id';
  const INITIAL_STATE = { id, status: 'initial' } satisfies State;
  const aggregate = createDeciderAggregate(bookingDecider, INITIAL_STATE);

  beforeEach(() => {
    vi.setSystemTime(new Date('2000-06-01'));
    aggregate.resetToInitialState();
  });

  it('schedule event', () => {
    const events = aggregate.run({ type: 'SCHEDULE_EVENT', data: { startAt: new Date('2000-07-01'), patientId } });

    expect(events).toEqual([
      {
        data: {
          id: expect.any(String),
          startAt: new Date('2000-07-01'),
          patientId,
          scheduledAt: expect.any(Date),
        },
        type: 'EVENT_SCHEDULED',
      },
    ]);
    expect(aggregate.getState()).toEqual({
      outcome: null,
      startAt: new Date('2000-07-01'),
      id,
      patientId,
      status: 'scheduled',
      scheduledAt: expect.any(Date),
    });
  });

  it('rescheduled event', () => {
    const originalStartAt = new Date('2000-07-01');
    aggregate.run({ type: 'SCHEDULE_EVENT', data: { startAt: originalStartAt, patientId } });

    const events = aggregate.run({
      type: 'RESCHEDULE_EVENT',
      data: { startAt: new Date('2000-07-02') },
    });

    expect(events).toEqual([
      {
        data: {
          startAt: new Date('2000-07-02'),
        },
        type: 'EVENT_RESCHEDULED',
      },
    ]);
    expect(aggregate.getState()).toEqual({
      outcome: null,
      patientId,
      startAt: new Date('2000-07-02'),
      id,
      status: 'scheduled',
      scheduledAt: expect.any(Date),
    });
  });

  it('cancel event', () => {
    aggregate.run({ type: 'SCHEDULE_EVENT', data: { startAt: new Date('2000-07-01'), patientId } });

    const events = aggregate.run({
      type: 'CANCEL_EVENT',
      data: {},
    });

    expect(events).toEqual([
      {
        data: { cancelledAt: expect.any(Date), cancellationType: 'normal' },
        type: 'EVENT_CANCELLED',
      },
    ]);
    expect(aggregate.getState()).toEqual({
      outcome: {
        type: 'cancelled',
        cancelledAt: expect.any(Date),
        cancellationType: 'normal',
      },
      patientId,
      startAt: new Date('2000-07-01'),
      id,
      status: 'scheduled',
      scheduledAt: expect.any(Date),
    });
  });
});
