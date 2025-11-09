import { afterEach, describe, expect, it } from 'vitest';
import { createDeciderRunner } from './@utils/decider';
import { decider } from './decider-approach';
import { EsStore } from './store/esStore';
import { SimpleStore } from './store/store';

describe('Simple Store', () => {
  const id = 'foo-id';

  const simpleStore = SimpleStore();

  afterEach(async () => {
    await simpleStore.purge(id);
  });

  it('', async () => {
    const runner = createDeciderRunner(decider, { id, paths: [] });
    runner.run({
      data: {
        professionalId: 'nt-id',
        professionalRole: 'nutritionist',
        type: 'wlm',
      },
      type: 'START_PATH',
    });

    await simpleStore.save(runner.getState());

    const stateFromStore = await simpleStore.getById(id);
    expect(stateFromStore).toStrictEqual(runner.getState());
  });
});

describe('Event Store', () => {
  const id = 'bar-id';
  const INITIAL_STATE = { id, paths: [] };

  const esStore = EsStore();

  afterEach(async () => {
    await esStore.purge(id);
  });

  it('', async () => {
    const runner = createDeciderRunner(decider, INITIAL_STATE);
    const events = runner.run({
      data: {
        professionalId: 'nt-id',
        professionalRole: 'nutritionist',
        type: 'wlm',
      },
      type: 'START_PATH',
    });

    await esStore.append(id, events);

    const eventsFromStore = await esStore.load(id);
    const stateFromStore = eventsFromStore.reduce(decider.evolve, INITIAL_STATE);
    expect(stateFromStore).toStrictEqual(runner.getState());
  });
});
