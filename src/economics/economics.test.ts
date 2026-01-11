import { describe, expect, it } from 'vitest';
import { decide } from './decide';
import type { State } from './types';

describe('patientEconomicsDecider', () => {
  const id = 'foo-patient-id';
  const INITIAL_STATE = { id, prices: [], coverages: [] } satisfies State;

  describe('refresh estimates', () => {
    it('two psychotherapy sessions', () => {
      const events = decide(
        {
          type: 'REVISE_ESTIMATES',
          data: {
            sessions: [
              { id: 's1', number: 1, startAt: new Date('2026-01-01'), pathType: 'psychotherapy', status: 'active' },
              { id: 's2', number: 2, startAt: new Date('2026-01-02'), pathType: 'psychotherapy', status: 'active' },
            ],
          },
        },
        INITIAL_STATE,
      );

      expect(events).toEqual([
        {
          data: {
            prices: [
              {
                price: 0,
                reason: 'first_session',
                sessionId: 's1',
                status: 'ESTIMATED',
              },
              {
                price: 4500,
                reason: 'path_standard',
                sessionId: 's2',
                status: 'ESTIMATED',
              },
            ],
          },
          type: 'PRICES_REVISED',
        },
      ]);
    });
  });
});
