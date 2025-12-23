import { beforeEach, describe, expect, it } from 'vitest';
import { createDeciderAggregate } from '../../@utils/decider';
import { billableSessionDecider } from './index';
import type { State } from './types';

describe('billableSessionDecider', () => {
  const id = 'session-id';
  const patientId = 'foo-patient-id';
  const INITIAL_STATE = { id, status: 'initial' } satisfies State;
  const aggregate = createDeciderAggregate(billableSessionDecider, INITIAL_STATE);

  beforeEach(() => {
    aggregate.resetToInitialState();
  });

  it('price billable session', () => {
    const events = aggregate.run({
      type: 'PRICE_BILLABLE_SESSION',
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
        type: 'BILLABLE_SESSION_PRICED',
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
      status: 'priced',
    });
  });

  it('reprice billable session', () => {
    aggregate.run({
      type: 'PRICE_BILLABLE_SESSION',
      data: { cost: 4500, reason: 'standard', patientId },
    });

    const events = aggregate.run({
      type: 'REPRICE_BILLABLE_SESSION',
      data: { cost: 5000, reason: 'standard' },
    });

    expect(events).toEqual([
      {
        data: {
          cost: 5000,
          repricedAt: expect.any(Date),
          reason: 'standard',
        },
        type: 'BILLABLE_SESSION_REPRICED',
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
      status: 'priced',
    });
  });

  it('release billable session', () => {
    aggregate.run({
      type: 'PRICE_BILLABLE_SESSION',
      data: { cost: 4500, reason: 'standard', patientId },
    });

    const events = aggregate.run({
      type: 'RELEASE_BILLABLE_SESSION',
      data: {},
    });

    expect(events).toEqual([
      {
        data: {
          releasedAt: expect.any(Date),
        },
        type: 'BILLABLE_SESSION_RELEASED',
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
      status: 'priced',
    });
  });
});
