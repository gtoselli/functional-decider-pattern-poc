import { registerPolicy } from '../@utils/policy';
import { NOTIFICATION_POLICY, PRICING_POLICY, SESSION_CANCELLATION_POLICY } from './policies';

/**
 * Register all domain policies globally
 * This should be called once at application startup
 */
export function registerDomainPolicies(): void {
  // Register pricing policy: SESSION_CLASSIFIED → EVALUATE_PRICE
  registerPolicy(PRICING_POLICY);

  // Register cancellation policy: APPOINTMENT_CANCELLED → RECLASSIFY_SESSION
  registerPolicy(SESSION_CANCELLATION_POLICY);

  // Register notification policy: PRICE_EVALUATED → Send notification
  registerPolicy(NOTIFICATION_POLICY);

  console.log('✅ Domain policies registered:', {
    pricing: 'SESSION_CLASSIFIED → EVALUATE_PRICE',
    cancellation: 'APPOINTMENT_CANCELLED → RECLASSIFY_SESSION',
    notification: 'PRICE_EVALUATED → Notify',
  });
}
