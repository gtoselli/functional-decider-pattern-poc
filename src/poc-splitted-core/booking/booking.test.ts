import { beforeEach, describe, expect, it } from 'vitest';
import { createDeciderAggregate } from '../../@utils/decider';
import { bookingDecider } from './index';
import type { State } from './types';

describe('bookingDecider', () => {
  const id = 'foo-patient-id';
  const INITIAL_STATE = { id, events: [] } satisfies State;
  const aggregate = createDeciderAggregate(bookingDecider, INITIAL_STATE);

  beforeEach(() => {
    aggregate.resetToInitialState();
  });

  it('schedule event', () => {
    const events = aggregate.run({ type: 'SCHEDULE_EVENT', data: { startAt: new Date('2000-07-01') } });

    expect(events).toEqual([
      {
        data: {
          id: expect.any(String),
          startAt: new Date('2000-07-01'),
        },
        type: 'EVENT_SCHEDULED',
      },
    ]);
    expect(aggregate.getState()).toEqual({
      events: [
        {
          cancelledAt: null,
          id: expect.any(String),
          startAt: new Date('2000-07-01'),
        },
      ],
      id,
    });
  });

  it('rescheduled event', () => {
    const originalStartAt = new Date('2000-07-01');
    aggregate.run({ type: 'SCHEDULE_EVENT', data: { startAt: originalStartAt } });

    const events = aggregate.run({
      type: 'RESCHEDULE_EVENT',
      data: { id: aggregate.getState()['events'][0].id, startAt: new Date('2000-07-02') },
    });

    expect(events).toEqual([
      {
        data: {
          id: expect.any(String),
          startAt: new Date('2000-07-02'),
        },
        type: 'EVENT_RESCHEDULED',
      },
    ]);
    expect(aggregate.getState()).toEqual({
      events: [
        {
          cancelledAt: null,
          id: expect.any(String),
          startAt: new Date('2000-07-02'),
        },
      ],
      id,
    });
  });

  it('cancel event', () => {
    aggregate.run({ type: 'SCHEDULE_EVENT', data: { startAt: new Date('2000-07-01') } });

    const events = aggregate.run({
      type: 'CANCEL_EVENT',
      data: { id: aggregate.getState()['events'][0].id },
    });

    expect(events).toEqual([
      {
        data: {
          id: expect.any(String),
          cancelledAt: expect.any(Date),
          startAt: expect.any(Date),
        },
        type: 'EVENT_CANCELLED',
      },
    ]);
    expect(aggregate.getState()).toEqual({
      events: [
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
