import type { Command, Event, State } from './types';

export function decide(cmd: Command, state: State): Event[] {
  switch (cmd.type) {
    case 'SCHEDULE_EVENT': {
      if (state.status === 'scheduled') throw new Error('Event already scheduled');
      return [
        {
          data: { id: state.id, startAt: cmd.data.startAt, patientId: cmd.data.patientId, scheduledAt: new Date() },
          type: 'EVENT_SCHEDULED',
        },
      ];
    }
    case 'CANCEL_EVENT': {
      if (state.status === 'initial') throw new Error('Event not scheduled');
      if (state.cancelledAt) throw new Error('Event already cancelled');

      return [
        {
          data: { cancelledAt: new Date() },
          type: 'EVENT_CANCELLED',
        },
      ];
    }
    case 'RESCHEDULE_EVENT': {
      if (state.status === 'initial') throw new Error('Event not scheduled');
      if (state.cancelledAt) throw new Error('Event cancelled');

      return [{ data: { startAt: cmd.data.startAt }, type: 'EVENT_RESCHEDULED' }];
    }

    default: {
      const _exhaustive: never = cmd;
      return _exhaustive;
    }
  }
}
