/** biome-ignore-all lint/suspicious/noThenProperty: <explanation> */

import type { Aggregate } from '../@utils/decider';
import type { Policy } from '../@utils/policy';
import type { BookingDecider, Event as BookingEvent } from './booking/types';
import type { ClinicalDecider, Event as ClinicalEvent } from './clinical/types';
import type { EconomicsDecider, Event as EconomicsEvent } from './economics/types';

type Event = BookingEvent | ClinicalEvent | EconomicsEvent;

type Actors = {
  booking: Aggregate<BookingDecider>;
  clinical: Aggregate<ClinicalDecider>;
  economics: Aggregate<EconomicsDecider>;
};

// Policy: Whenever a session is classified, evaluate its price
export const PRICING_POLICY: Policy<Actors, Event> = {
  when: 'SESSION_CLASSIFIED',
  then: (event, actors) => {
    if (event.type === 'SESSION_CLASSIFIED') {
      return actors.economics.run({
        type: 'EVALUATE_PRICE' as const,
        data: {
          sessionId: event.data.id,
          number: event.data.number,
        },
      });
    }
    return [];
  },
};

// Policy: Whenever an appointment is cancelled, reclassify related session
export const SESSION_CANCELLATION_POLICY: Policy<Actors, Event> = {
  when: 'APPOINTMENT_CANCELLED',
  then: (event, actors) => {
    if (event.type === 'APPOINTMENT_CANCELLED') {
      // Find and reclassify the session associated with this appointment
      return actors.clinical.run({
        type: 'RECLASSIFY_SESSION' as const,
        data: {
          appointmentId: event.data.id,
        },
      });
    }
    return [];
  },
};

// Future policy example: Send notification when price is evaluated
export const NOTIFICATION_POLICY: Policy<Actors, Event> = {
  when: 'PRICE_EVALUATED',
  then: (event, _actors) => {
    if (event.type === 'PRICE_EVALUATED') {
      // In real world, this would trigger a notification service
      console.log('📧 Notification: Price evaluated -', event.data);
      // For now, return no events (notifications are side effects)
      return [];
    }
    return [];
  },
};
