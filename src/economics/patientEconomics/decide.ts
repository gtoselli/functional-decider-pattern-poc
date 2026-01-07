import type { Command, CostReason, Event, State } from './types';

export function decide(cmd: Command, state: State): Event[] {
  switch (cmd.type) {
    case 'PRICE_SESSION': {
      const cost =
        cmd.data.pathType === 'wlm' ? getWlmCost(cmd.data.number, state) : getPsychotherapyCost(cmd.data.number);

      return [{ data: { id: cmd.data.sessionId, cost: cost.cost, reason: cost.reason }, type: 'SESSION_PRICED' }];
    }

    case 'SET_SUBSCRIPTION_STATUS':
      return [{ type: 'SUBSCRIPTION_STATUS_SET', data: { status: cmd.data.status } }];

    case 'VOID_SESSION_PRICE': {
      return [{ data: { id: cmd.data.sessionId }, type: 'SESSION_PRICE_VOIDED' }];
    }
    default: {
      const _exhaustive: never = cmd;
      return _exhaustive;
    }
  }
}

function getWlmCost(number: number, state: State): { cost: number; reason: CostReason } {
  if (number === 1) return { cost: 0, reason: 'first_session' };

  if (!state.subscription || state.subscription.status !== 'active') throw new Error('Active subscription not found');
  return { cost: 0, reason: 'subscription' };
}

function getPsychotherapyCost(number: number): { cost: number; reason: CostReason } {
  if (number === 1) return { cost: 0, reason: 'first_session' };
  return { cost: 4500, reason: 'path_standard' };
}
