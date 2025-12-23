import { beforeEach, describe, expect, it } from 'vitest';
import { createDeciderAggregate } from '../../../@utils/decider';
import { sessionOrderDecider } from './index';
import type { State } from './types';

describe('sessionOrderDecider', () => {
  const id = 'session-id';
  const patientId = 'foo-patient-id';
  const INITIAL_STATE = { id, status: 'initial' } satisfies State;
  const aggregate = createDeciderAggregate(sessionOrderDecider, INITIAL_STATE);

  beforeEach(() => {
    aggregate.resetToInitialState();
  });

  it('place', () => {
    const events = aggregate.run({
      type: 'PLACE_SESSION_ORDER',
      data: { cost: 4500, reason: 'standard', patientId },
    });

    expect(events).toEqual([
      {
        data: {
          cost: 4500,
          id,
          patientId,
          placedAt: expect.any(Date),
          reason: 'standard',
        },
        type: 'SESSION_ORDER_PLACED',
      },
    ]);
    expect(aggregate.getState()).toEqual({
      cost: 4500,
      id,
      patientId,
      placedAt: expect.any(Date),
      reason: 'standard',
      voidedAt: null,
      status: 'quoted',
    });
  });

  it('release billable session', () => {
    aggregate.run({
      type: 'PLACE_SESSION_ORDER',
      data: { cost: 4500, reason: 'standard', patientId },
    });

    const events = aggregate.run({
      type: 'VOID_SESSION_ORDER',
      data: {},
    });

    expect(events).toEqual([
      {
        data: {
          voidedAt: expect.any(Date),
        },
        type: 'SESSION_ORDER_VOIDED',
      },
    ]);
    expect(aggregate.getState()).toEqual({
      cost: 4500,
      id,
      patientId,
      placedAt: expect.any(Date),
      reason: 'standard',
      voidedAt: expect.any(Date),
      status: 'quoted',
    });
  });
});
