import { beforeEach, describe, expect, it } from 'vitest';
import { createDeciderAggregate } from '../../../@utils/decider';
import { sessionQuoteDecider } from './index';
import type { State } from './types';

describe('sessionQuoteDecider', () => {
  const id = 'session-id';
  const patientId = 'foo-patient-id';
  const INITIAL_STATE = { id, status: 'initial' } satisfies State;
  const aggregate = createDeciderAggregate(sessionQuoteDecider, INITIAL_STATE);

  beforeEach(() => {
    aggregate.resetToInitialState();
  });

  it('place', () => {
    const events = aggregate.run({
      type: 'PLACE_SESSION_QUOTE',
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
        type: 'SESSION_QUOTE_PLACED',
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
      type: 'PLACE_SESSION_QUOTE',
      data: { cost: 4500, reason: 'standard', patientId },
    });

    const events = aggregate.run({
      type: 'VOID_SESSION_QUOTE',
      data: {},
    });

    expect(events).toEqual([
      {
        data: {
          voidedAt: expect.any(Date),
        },
        type: 'SESSION_QUOTE_VOIDED',
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
