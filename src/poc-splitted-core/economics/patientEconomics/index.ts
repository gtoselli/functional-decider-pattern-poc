import type { Decider } from '../../../@utils/decider';
import { decide } from './decide';
import { evolve } from './evolve';
import type { Command, Event, State } from './types';

export const economicsDecider: Decider<State, Command, Event> = { decide, evolve };
