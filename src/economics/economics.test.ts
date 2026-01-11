import { beforeEach, describe, expect, it } from 'vitest';
import { decide } from './decide';
import { evolve } from './evolve';
import type { State } from './types';

describe('patientEconomicsDecider', () => {
  const id = 'foo-patient-id';
  const INITIAL_STATE = { id, prices: [], coverages: [] } satisfies State;

  // describe('refresh estimates', () => {
  //   it('two psychotherapy sessions', () => {
  //     const events = decide(
  //       {
  //         type: 'REFRESH_ESTIMATES',
  //         data: {
  //           pathType: 'psychotherapy',
  //           sessions: [
  //             { id: 's1', number: 1, startAt: new Date('2026-01-01') },
  //             { id: 's2', number: 2, startAt: new Date('2026-01-02') },
  //           ],
  //         },
  //       },
  //       INITIAL_STATE,
  //     );
  //
  //     expect(events).toEqual([
  //       { data: { id: 's1', price: 0, reason: 'first_session' }, type: 'PRICE_ESTIMATED' },
  //       { data: { id: 's2', price: 4500, reason: 'path_standard' }, type: 'PRICE_ESTIMATED' },
  //     ]);
  //   });
  //
  //   it('two psychotherapy sessions with a discount coverage', () => {
  //     const state = decide(
  //       {
  //         type: 'REFRESH_ESTIMATES',
  //         data: {
  //           pathType: 'psychotherapy',
  //           sessions: [
  //             { id: 's1', number: 1, startAt: new Date('2026-01-01') },
  //             { id: 's2', number: 2, startAt: new Date('2026-01-02') },
  //           ],
  //         },
  //       },
  //       INITIAL_STATE,
  //     ).reduce(evolve, INITIAL_STATE);
  //
  //     const newState = decide({ type: 'ADD_COVERAGE', data: { type: 'discount', sessionCount: 1 } }, state).reduce(
  //       evolve,
  //       state,
  //     );
  //
  //     const finalStateState = decide(
  //       {
  //         type: 'REFRESH_ESTIMATES',
  //         data: {
  //           pathType: 'psychotherapy',
  //           sessions: [
  //             { id: 's1', number: 1, startAt: new Date('2026-01-01') },
  //             { id: 's2', number: 2, startAt: new Date('2026-01-02') },
  //           ],
  //         },
  //       },
  //       newState,
  //     ).reduce(evolve, newState);
  //
  //     console.log(finalStateState);
  //   });
  // });
});
