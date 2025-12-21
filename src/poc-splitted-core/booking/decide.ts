import { randomUUID } from 'node:crypto';
import type { Command, Event, State } from './types';

export function decide(cmd: Command, state: State): Event[] {
  switch (cmd.type) {
    case 'SCHEDULE_EVENT': {
      return [{ data: { id: randomUUID(), startAt: cmd.data.startAt }, type: 'EVENT_SCHEDULED' }];
    }
    case 'CANCEL_EVENT': {
      const event = state.events.find((a) => a.id === cmd.data.id);
      if (!event) throw new Error('Event not found');
      if (event.cancelledAt) throw new Error('Event already cancelled');

      return [
        {
          data: { id: cmd.data.id, cancelledAt: new Date(), startAt: event.startAt },
          type: 'EVENT_CANCELLED',
        },
      ];
    }
    case 'RESCHEDULE_EVENT': {
      const event = state.events.find((a) => a.id === cmd.data.id);
      if (!event) throw new Error('Event not found');
      if (event.cancelledAt) throw new Error('Event cancelled');

      return [{ data: { id: cmd.data.id, startAt: cmd.data.startAt }, type: 'EVENT_RESCHEDULED' }];
    }

    default: {
      const _exhaustive: never = cmd;
      return _exhaustive;
    }
  }
}
