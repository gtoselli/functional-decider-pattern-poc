// PatientPaths aggregate root

import type { PathType, ProfessionalRole } from '../shared-types';
import { PathEntity } from './path-entity';

export class PatientPaths {
  constructor(
    readonly id: string,
    private readonly paths: PathEntity[],
  ) {}

  static factory(id: string) {
    return new PatientPaths(id, []);
  }

  start(type: PathType, professionalId: string, professionalRole: ProfessionalRole) {
    const path = PathEntity.create(type, professionalId, professionalRole);
    this.paths.push(PathEntity.create(type, professionalId, professionalRole));
    return path.id;
  }

  scheduleSession(pathType: PathType, startAt: Date) {
    const path = this.getPath(pathType);
    path.scheduleSession(startAt);
  }

  addAnotherProfessional(pathType: PathType, professionalId: string, professionalRole: ProfessionalRole) {
    const path = this.getPath(pathType);
    path.addAnotherProfessional(professionalId, professionalRole);
  }

  private getPath(type: string) {
    const path = this.paths.find((p) => p.type === type);
    if (!path) throw new Error('Path not found');
    return path;
  }
}
