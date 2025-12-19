import { randomUUID } from 'node:crypto';
import type { Command, Event, State } from './types';

export function decide(cmd: Command, state: State): Event[] {
  switch (cmd.type) {
    case 'SCHEDULE_APPOINTMENT': {
      return [{ data: { id: randomUUID(), startAt: cmd.data.startAt }, type: 'APPOINTMENT_SCHEDULED' }];
    }
    case 'CANCEL_APPOINTMENT': {
      const app = state.appointments.find((a) => a.id === cmd.data.id);
      if (!app) throw new Error('Appointment not found');
      if (app.cancelledAt) throw new Error('Appointment already cancelled');

      return [
        {
          data: { id: cmd.data.id, cancelledAt: new Date(), startAt: app.startAt },
          type: 'APPOINTMENT_CANCELLED',
        },
      ];
    }
    case 'RESCHEDULE_APPOINTMENT': {
      const app = state.appointments.find((a) => a.id === cmd.data.id);
      if (!app) throw new Error('Appointment not found');
      if (app.cancelledAt) throw new Error('Appointment cancelled');

      return [{ data: { id: cmd.data.id, startAt: cmd.data.startAt }, type: 'APPOINTMENT_RESCHEDULED' }];
    }

    default: {
      const _exhaustive: never = cmd;
      return _exhaustive;
    }
  }
}
