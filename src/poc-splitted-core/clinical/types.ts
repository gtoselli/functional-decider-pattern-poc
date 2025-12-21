import type { Decider } from '../../@utils/decider';

export interface State {
  id: string;
  sessions: { id: string; number: number; startAt: Date; revokedAt?: Date }[];
}

interface AdmitSessionCmd {
  type: 'ADMIT_SESSION';
  data: { id: string; startAt: Date };
}

interface ReassessSessionCmd {
  type: 'REASSESS_SESSION';
  data: { id: string; startAt: Date };
}

interface RevokeSessionCmd {
  type: 'REVOKE_SESSION';
  data: { id: string };
}

export type Command = AdmitSessionCmd | ReassessSessionCmd | RevokeSessionCmd;

interface SessionAdmittedEvent {
  type: 'SESSION_ADMITTED';
  data: { id: string; startAt: Date };
}

interface SessionClassifiedEvent {
  type: 'SESSION_CLASSIFIED';
  data: { id: string; number: number; startAt: Date };
}

interface SessionRevokedEvent {
  type: 'SESSION_REVOKED';
  data: { id: string; revokedAt: Date };
}

export type Event = SessionAdmittedEvent | SessionClassifiedEvent | SessionRevokedEvent;

export type ClinicalDecider = Decider<State, Command, Event>;
