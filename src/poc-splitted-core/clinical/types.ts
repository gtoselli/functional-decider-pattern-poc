import type { Decider } from '../../@utils/decider';

export interface State {
  id: string;
  sessions: { id: string; number: number; startAt: Date }[];
}

interface ClassifySessionCmd {
  type: 'CLASSIFY_SESSION';
  data: { id: string; startAt: Date };
}

export type Command = ClassifySessionCmd;

interface SessionClassifiedEvent {
  type: 'SESSION_CLASSIFIED';
  data: { id: string; number: number; startAt: Date };
}

export type Event = SessionClassifiedEvent;

export type ClinicalDecider = Decider<State, Command, Event>;
