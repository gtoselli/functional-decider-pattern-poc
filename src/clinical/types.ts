import type { Decider } from '../@utils/decider';
import type { PathType } from '../shared-types';

export interface State {
  id: string;
  paths: {
    id: string;
    type: PathType;
    startedAt: Date;
    professionals: { id: string; addedAt: Date; role: ProfessionalRole }[];
    sessions: { id: string; number: number; startAt: Date; revokedAt: Date | null }[];
    cycle?: { startedAt: Date; endedAt?: Date };
  }[];
}

interface AddSessionCmd {
  type: 'ADD_SESSION';
  data: { id: string; startAt: Date; pathId: string };
}

interface ReassessSessionCmd {
  type: 'REASSESS_SESSION';
  data: { id: string; startAt: Date };
}

interface RemoveSessionCmd {
  type: 'REMOVE_SESSION';
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

export type Command = AddSessionCmd | ReassessSessionCmd | RemoveSessionCmd | AddProfessionalCmd | StartPathCmd;

interface SessionAddedEvent {
  type: 'SESSION_ADDED';
  data: { id: string; startAt: Date; pathId: string };
}

interface SessionClassifiedEvent {
  type: 'SESSION_CLASSIFIED';
  data: { id: string; number: number; startAt: Date; pathId: string };
}

interface SessionRemovedEvent {
  type: 'SESSION_REMOVED';
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
  | SessionAddedEvent
  | SessionClassifiedEvent
  | SessionRemovedEvent
  | ProfessionalAddedEvent
  | PathStartedEvent;

export type ClinicalDecider = Decider<State, Command, Event>;

export type ProfessionalRole = 'professional' | 'dietitian' | 'nutritionist';
