// PatientPaths entity

import { randomUUID } from 'node:crypto';
import type { PathType, ProfessionalRole } from '../shared-types';

export class PathEntity {
  constructor(
    readonly id: string,
    readonly type: PathType,
    readonly sessions: {
      id: string;
      startAt: Date;
      state: 'scheduled' | 'cancelled';
      duration: number;
    }[],
    readonly professionals: { id: string; role: ProfessionalRole }[],
    readonly rules: PathRules,
  ) {
    this.rules.path = this;
  }

  static create(type: PathType, professionalId: string, professionalRole: ProfessionalRole): PathEntity {
    const RULES = {
      psychotherapy: new PsychotherapyPathRules(),
      wlm: new WlmPathRules(),
    } satisfies Record<PathType, PathRules>;

    return new PathEntity(randomUUID(), type, [], [{ id: professionalId, role: professionalRole }], RULES[type]);
  }

  scheduleSession(startAt: Date) {
    const session = {
      duration: this.rules.getSessionDuration(),
      id: randomUUID(),
      startAt,
      state: 'scheduled' as const,
    };
    this.sessions.push(session);
    return session.id;
  }

  addAnotherProfessional(professionalId: string, professionalRole: ProfessionalRole) {
    if (!this.rules.canHaveAnotherProfessional(professionalRole))
      throw new Error('This path can not have another professional');
    this.professionals.push({ id: professionalId, role: professionalRole });
  }
}

abstract class PathRules {
  path!: PathEntity;

  abstract getSessionDuration(): number;
  abstract canHaveAnotherProfessional(role: ProfessionalRole): boolean;
}

class WlmPathRules extends PathRules {
  getSessionDuration(): number {
    return 60;
  }

  canHaveAnotherProfessional(role: ProfessionalRole) {
    if (this.path.professionals.length === 2) return false;
    return role === 'dietitian';
  }
}

class PsychotherapyPathRules extends PathRules {
  getSessionDuration(): number {
    return 45;
  }

  canHaveAnotherProfessional() {
    return false;
  }
}
