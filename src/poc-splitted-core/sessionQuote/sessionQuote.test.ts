import { beforeEach, describe, expect, it } from 'vitest';
import { createDeciderAggregate } from '../../@utils/decider';
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
          pricedAt: expect.any(Date),
          reason: 'standard',
        },
        type: 'SESSION_QUOTE_PLACED',
      },
    ]);
    expect(aggregate.getState()).toEqual({
      cost: 4500,
      id,
      patientId,
      pricedAt: expect.any(Date),
      reason: 'standard',
      releasedAt: null,
      repricedAt: null,
      status: 'quoted',
    });
  });

  it('replace', () => {
    aggregate.run({
      type: 'PLACE_SESSION_QUOTE',
      data: { cost: 4500, reason: 'standard', patientId },
    });

    const events = aggregate.run({
      type: 'REPLACE_SESSION_QUOTE',
      data: { cost: 5000, reason: 'standard' },
    });

    expect(events).toEqual([
      {
        data: {
          cost: 5000,
          repricedAt: expect.any(Date),
          reason: 'standard',
        },
        type: 'SESSION_QUOTE_REPLACED',
      },
    ]);
    expect(aggregate.getState()).toEqual({
      cost: 5000,
      id,
      patientId,
      pricedAt: expect.any(Date),
      reason: 'standard',
      releasedAt: null,
      repricedAt: expect.any(Date),
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
          releasedAt: expect.any(Date),
        },
        type: 'SESSION_QUOTE_VOIDED',
      },
    ]);
    expect(aggregate.getState()).toEqual({
      cost: 4500,
      id,
      patientId,
      pricedAt: expect.any(Date),
      reason: 'standard',
      releasedAt: expect.any(Date),
      repricedAt: null,
      status: 'quoted',
    });
  });
});
