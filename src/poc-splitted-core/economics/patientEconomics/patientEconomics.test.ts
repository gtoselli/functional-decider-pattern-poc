import { beforeEach, describe, expect, it } from 'vitest';
import { createDeciderAggregate } from '../../../@utils/decider';
import { economicsDecider } from './index';
import type { State } from './types';

describe('patientEconomicsDecider', () => {
  const id = 'foo-patient-id';
  const INITIAL_STATE = { id } satisfies State;
  const aggregate = createDeciderAggregate(economicsDecider, INITIAL_STATE);

  beforeEach(() => {
    aggregate.resetToInitialState();
  });

  it('price session', () => {
    const events = aggregate.run({ type: 'PRICE_SESSION', data: { sessionId: 's1', number: 1 } });

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
    aggregate.run({ type: 'PRICE_SESSION', data: { sessionId: 's1', number: 1 } });
    const events = aggregate.run({ type: 'PRICE_SESSION', data: { sessionId: 's2', number: 2 } });

    expect(events).toEqual([
      {
        data: {
          cost: 4500,
          reason: 'standard',
          id: 's2',
        },
        type: 'SESSION_PRICED',
      },
    ]);
    expect(aggregate.getState()).toEqual({ id });
  });
});
