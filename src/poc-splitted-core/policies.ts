/** biome-ignore-all lint/suspicious/noThenProperty: <explanation> */

import type { Policy } from '../@utils/policy';
import type { createBookingRepo, createClinicalRepo, createEconomicsRepo } from './infra';
import type { Event as BookingEvent } from './booking/types';
import type { Event as ClinicalEvent } from './clinical/types';
import type { Event as EconomicsEvent } from './economics/types';

type Event = BookingEvent | ClinicalEvent | EconomicsEvent;

type Dependencies = {
  booking: ReturnType<typeof createBookingRepo>;
  clinical: ReturnType<typeof createClinicalRepo>;
  economics: ReturnType<typeof createEconomicsRepo>;
};

// Policy: Whenever a session is classified, evaluate its price
export const PRICING_POLICY: Policy<Dependencies, Event> = {
  when: 'SESSION_CLASSIFIED',
  then: (event, deps) => {
    if (event.type === 'SESSION_CLASSIFIED') {
      // Get aggregate, run command, save
      const economics = deps.economics.getById(event.data.id); // Using session id as aggregate id
      const events = economics.run({
        type: 'EVALUATE_PRICE' as const,
        data: {
          sessionId: event.data.id,
          number: event.data.number,
        },
      });
      deps.economics.save(economics);
      return events;
    }
    return [];
  },
};

// Policy: Whenever an appointment is cancelled, reclassify related session
export const SESSION_CANCELLATION_POLICY: Policy<Dependencies, Event> = {
  when: 'APPOINTMENT_CANCELLED',
  then: (event, deps) => {
    if (event.type === 'APPOINTMENT_CANCELLED') {
      // Get aggregate, run command, save
      const clinical = deps.clinical.getById(event.data.id); // Using appointment id as aggregate id
      const events = clinical.run({
        type: 'RECLASSIFY_SESSION' as const,
        data: {
          appointmentId: event.data.id,
        },
      });
      deps.clinical.save(clinical);
      return events;
    }
    return [];
  },
};

// Future policy example: Send notification when price is evaluated
export const NOTIFICATION_POLICY: Policy<Dependencies, Event> = {
  when: 'PRICE_EVALUATED',
  then: (event, _deps) => {
    if (event.type === 'PRICE_EVALUATED') {
      // In real world, this would trigger a notification service
      console.log('📧 Notification: Price evaluated -', event.data);
      // For now, return no events (notifications are side effects)
      return [];
    }
    return [];
  },
};
