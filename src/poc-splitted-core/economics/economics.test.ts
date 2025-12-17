import { beforeEach, describe, expect, it } from 'vitest';
import { createDeciderAggregate } from '../../@utils/decider';
import { economicsDecider } from './index';
import type { State } from './types';

describe('economicsDecider', () => {
  const id = 'foo-patient-id';
  const INITIAL_STATE = { id, prices: [] } satisfies State;
  const aggregate = createDeciderAggregate(economicsDecider, INITIAL_STATE);

  beforeEach(() => {
    aggregate.resetToInitialState();
  });

  it('evaluate price', () => {
    const events = aggregate.run({ type: 'EVALUATE_PRICE', data: { sessionId: 's1', number: 1 } });

    expect(events).toEqual([
      {
        data: {
          cost: 0,
          reason: 'first_session',
          id: 's1',
        },
        type: 'PRICE_EVALUATED',
      },
    ]);
    expect(aggregate.getState()).toEqual({
      prices: [
        {
          cost: 0,
          reason: 'first_session',
          id: 's1',
        },
      ],
      id,
    });
  });

  it('evaluate price: another price', () => {
    aggregate.run({ type: 'EVALUATE_PRICE', data: { sessionId: 's1', number: 1 } });
    const events = aggregate.run({ type: 'EVALUATE_PRICE', data: { sessionId: 's2', number: 2 } });

    expect(events).toEqual([
      {
        data: {
          cost: 4500,
          reason: 'standard',
          id: 's2',
        },
        type: 'PRICE_EVALUATED',
      },
    ]);
    expect(aggregate.getState()).toEqual({
      prices: [
        {
          cost: 0,
          reason: 'first_session',
          id: 's1',
        },
        {
          cost: 4500,
          reason: 'standard',
          id: 's2',
        },
      ],
      id,
    });
  });

  it('evaluate price: same price', () => {
    aggregate.run({ type: 'EVALUATE_PRICE', data: { sessionId: 's1', number: 1 } });
    const events = aggregate.run({ type: 'EVALUATE_PRICE', data: { sessionId: 's1', number: 2 } });

    expect(events).toEqual([
      {
        data: {
          cost: 4500,
          reason: 'standard',
          id: 's1',
        },
        type: 'PRICE_EVALUATED',
      },
    ]);
    expect(aggregate.getState()).toEqual({
      prices: [
        {
          cost: 4500,
          reason: 'standard',
          id: 's1',
        },
      ],
      id,
    });
  });
});
