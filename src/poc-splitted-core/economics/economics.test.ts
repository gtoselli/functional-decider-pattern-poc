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

  it('quote service', () => {
    const events = aggregate.run({ type: 'QUOTE_SERVICE', data: { sessionId: 's1', number: 1 } });

    expect(events).toEqual([
      {
        data: {
          cost: 0,
          reason: 'first_session',
          id: 's1',
        },
        type: 'SERVICE_QUOTED',
      },
    ]);
    expect(aggregate.getState()).toEqual({
      prices: [
        {
          cost: 0,
          reason: 'first_session',
          id: 's1',
          status: 'quoted',
        },
      ],
      id,
    });
  });

  it('quote service: another price', () => {
    aggregate.run({ type: 'QUOTE_SERVICE', data: { sessionId: 's1', number: 1 } });
    const events = aggregate.run({ type: 'QUOTE_SERVICE', data: { sessionId: 's2', number: 2 } });

    expect(events).toEqual([
      {
        data: {
          cost: 4500,
          reason: 'standard',
          id: 's2',
        },
        type: 'SERVICE_QUOTED',
      },
    ]);
    expect(aggregate.getState()).toEqual({
      prices: [
        {
          cost: 0,
          reason: 'first_session',
          id: 's1',
          status: 'quoted',
        },
        {
          cost: 4500,
          reason: 'standard',
          id: 's2',
          status: 'quoted',
        },
      ],
      id,
    });
  });

  it('quote service: same price', () => {
    aggregate.run({ type: 'QUOTE_SERVICE', data: { sessionId: 's1', number: 1 } });
    const events = aggregate.run({ type: 'QUOTE_SERVICE', data: { sessionId: 's1', number: 2 } });

    expect(events).toEqual([
      {
        data: {
          cost: 4500,
          reason: 'standard',
          id: 's1',
        },
        type: 'SERVICE_QUOTED',
      },
    ]);
    expect(aggregate.getState()).toEqual({
      prices: [
        {
          cost: 4500,
          reason: 'standard',
          id: 's1',
          status: 'quoted',
        },
      ],
      id,
    });
  });
});
