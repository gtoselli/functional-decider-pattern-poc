import type { Command, Event, State } from './types';

export function decide(cmd: Command, state: State): Event[] {
  switch (cmd.type) {
    case 'SCHEDULE_EVENT':
      return scheduleEvent(state, cmd.data.startAt, cmd.data.patientId);
    case 'CANCEL_EVENT':
      return cancelEvent(state);
    case 'RESCHEDULE_EVENT':
      return rescheduleEvent(state, cmd.data.startAt);
    default: {
      const _exhaustive: never = cmd;
      return _exhaustive;
    }
  }
}

function scheduleEvent(state: State, startAt: Date, patientId: string): Event[] {
  if (state.status === 'scheduled') throw new Error('Event already scheduled');
  return [
    {
      data: { id: state.id, startAt, patientId, scheduledAt: new Date() },
      type: 'EVENT_SCHEDULED',
    },
  ];
}

function cancelEvent(state: State): Event[] {
  if (state.status === 'initial') throw new Error('Event not scheduled');
  if (state.cancelledAt) throw new Error('Event already cancelled');

  return [
    {
      data: { cancelledAt: new Date() },
      type: 'EVENT_CANCELLED',
    },
  ];
}

function rescheduleEvent(state: State, startAt: Date): Event[] {
  if (state.status === 'initial') throw new Error('Event not scheduled');
  if (state.cancelledAt) throw new Error('Event cancelled');

  return [{ data: { startAt }, type: 'EVENT_RESCHEDULED' }];
}
