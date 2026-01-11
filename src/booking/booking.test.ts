import { beforeEach, describe, expect, it, vi } from 'vitest';
import { decide } from './decide';
import { evolve } from './evolve';
import type { State } from './types';

describe('bookingDecider', () => {
  const id = 'event-id';
  const patientId = 'foo-patient-id';
  const INITIAL_STATE = { id, status: 'initial' } satisfies State;

  beforeEach(() => {
    vi.setSystemTime(new Date('2000-06-01'));
  });

  it('schedule event', () => {
    const state = INITIAL_STATE;
    const events = decide({ type: 'SCHEDULE_EVENT', data: { startAt: new Date('2000-07-01'), patientId } }, state);

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
    expect(events.reduce(evolve, state)).toEqual({
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
    let state: State = INITIAL_STATE;

    state = decide({ type: 'SCHEDULE_EVENT', data: { startAt: originalStartAt, patientId } }, state).reduce(
      evolve,
      state,
    );

    const events = decide(
      {
        type: 'RESCHEDULE_EVENT',
        data: { startAt: new Date('2000-07-02') },
      },
      state,
    );

    expect(events).toEqual([
      {
        data: {
          startAt: new Date('2000-07-02'),
        },
        type: 'EVENT_RESCHEDULED',
      },
    ]);
    expect(events.reduce(evolve, state)).toEqual({
      outcome: null,
      patientId,
      startAt: new Date('2000-07-02'),
      id,
      status: 'scheduled',
      scheduledAt: expect.any(Date),
    });
  });

  it('cancel event', () => {
    let state: State = INITIAL_STATE;
    state = decide({ type: 'SCHEDULE_EVENT', data: { startAt: new Date('2000-07-01'), patientId } }, state).reduce(
      evolve,
      state,
    );

    const events = decide(
      {
        type: 'CANCEL_EVENT',
        data: {},
      },
      state,
    );

    expect(events).toEqual([
      {
        data: { cancelledAt: expect.any(Date), cancellationType: 'normal' },
        type: 'EVENT_CANCELLED',
      },
    ]);
    expect(events.reduce(evolve, state)).toEqual({
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
