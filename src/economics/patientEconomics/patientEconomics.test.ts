import { beforeEach, describe, expect, it } from 'vitest';
import { createDeciderAggregate } from '../../@utils/decider';
import { economicsDecider } from './index';
import type { State } from './types';

describe('patientEconomicsDecider', () => {
  const id = 'foo-patient-id';
  const INITIAL_STATE = { id } satisfies State;
  const aggregate = createDeciderAggregate(economicsDecider, INITIAL_STATE);

  beforeEach(() => {
    aggregate.resetToInitialState();
  });

  it('price session: psychotherapy', () => {
    const events = aggregate.run({
      type: 'PRICE_SESSION',
      data: { sessionId: 's1', number: 1, pathType: 'psychotherapy' },
    });

    expect(events).toEqual([
      {
        data: {
          cost: 0,
          reason: 'first_session',
          id: 's1',
        },
        type: 'SESSION_PRICED',
      },
    ]);
    expect(aggregate.getState()).toEqual({ id });
  });

  it('price session: another price', () => {
    aggregate.run({ type: 'PRICE_SESSION', data: { sessionId: 's1', number: 1, pathType: 'psychotherapy' } });
    const events = aggregate.run({
      type: 'PRICE_SESSION',
      data: { sessionId: 's2', number: 2, pathType: 'psychotherapy' },
    });

    expect(events).toEqual([
      {
        data: {
          cost: 4500,
          reason: 'path_standard',
          id: 's2',
        },
        type: 'SESSION_PRICED',
      },
    ]);
    expect(aggregate.getState()).toEqual({ id });
  });

  it('price session: wlm', () => {
    const events = aggregate.run({
      type: 'PRICE_SESSION',
      data: { sessionId: 's1', number: 1, pathType: 'wlm' },
    });

    expect(events).toEqual([
      {
        data: {
          cost: 0,
          reason: 'first_session',
          id: 's1',
        },
        type: 'SESSION_PRICED',
      },
    ]);
    expect(aggregate.getState()).toEqual({ id });
  });

  it('price session: another price: wlm', () => {
    aggregate.run({ type: 'PRICE_SESSION', data: { sessionId: 's1', number: 1, pathType: 'wlm' } });
    expect(() =>
      aggregate.run({
        type: 'PRICE_SESSION',
        data: { sessionId: 's2', number: 2, pathType: 'wlm' },
      }),
    ).toThrowError('Active subscription not found');

    aggregate.run({ type: 'SET_SUBSCRIPTION_STATUS', data: { status: 'active' } });

    const events = aggregate.run({
      type: 'PRICE_SESSION',
      data: { sessionId: 's2', number: 2, pathType: 'wlm' },
    });
    expect(events).toEqual([
      {
        data: {
          cost: 0,
          reason: 'subscription',
          id: 's2',
        },
        type: 'SESSION_PRICED',
      },
    ]);
  });
});
