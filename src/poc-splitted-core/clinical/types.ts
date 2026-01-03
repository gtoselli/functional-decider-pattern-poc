import type { Decider } from '../../@utils/decider';
import type { PathType } from '../../shared-types';

export interface State {
  id: string;
  paths: {
    id: string;
    type: PathType;
    startedAt: Date;
    professionals: { id: string; addedAt: Date; role: ProfessionalRole }[];
    sessions: { id: string; number: number; startAt: Date; revokedAt: Date | null }[];
  }[];
}

interface AdmitSessionCmd {
  type: 'ADMIT_SESSION';
  data: { id: string; startAt: Date; pathId: string };
}

interface ReassessSessionCmd {
  type: 'REASSESS_SESSION';
  data: { id: string; startAt: Date };
}

interface RevokeSessionCmd {
  type: 'REVOKE_SESSION';
  data: { id: string };
}

interface AddProfessionalCmd {
  type: 'ADD_PROFESSIONAL';
  data: { pathId: string; professionalId: string; role: ProfessionalRole };
}

interface StartPathCmd {
  type: 'START_PATH';
  data: { pathType: PathType };
}

export type Command = AdmitSessionCmd | ReassessSessionCmd | RevokeSessionCmd | AddProfessionalCmd | StartPathCmd;

interface SessionAdmittedEvent {
  type: 'SESSION_ADMITTED';
  data: { id: string; startAt: Date; pathId: string };
}

interface SessionClassifiedEvent {
  type: 'SESSION_CLASSIFIED';
  data: { id: string; number: number; startAt: Date; pathId: string };
}

interface SessionRevokedEvent {
  type: 'SESSION_REVOKED';
  data: { id: string; revokedAt: Date; pathId: string };
}

interface ProfessionalAddedEvent {
  type: 'PROFESSIONAL_ADDED';
  data: { pathId: string; professionalId: string; addedAt: Date; role: ProfessionalRole };
}

interface PathStartedEvent {
  type: 'PATH_STARTED';
  data: { id: string; pathType: PathType; startedAt: Date };
}

export type Event =
  | SessionAdmittedEvent
  | SessionClassifiedEvent
  | SessionRevokedEvent
  | ProfessionalAddedEvent
  | PathStartedEvent;

export type ClinicalDecider = Decider<State, Command, Event>;

export type ProfessionalRole = 'professional' | 'dietitian' | 'nutritionist';
