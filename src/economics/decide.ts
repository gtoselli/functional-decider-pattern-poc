import type { Command, Event, State } from './types';

export function decide(cmd: Command, state: State): Event[] {
  switch (cmd.type) {
    case 'REVISE_ESTIMATES': {
      return [
        {
          type: 'PRICES_REVISED',
          data: {
            prices: cmd.data.sessions
              .map((session) => {
                const price =
                  session.pathType === 'wlm'
                    ? getWlmPrice(session.number, state)
                    : getPsychotherapyPrice(session.number);

                const existingPrice = state.prices.find((p) => p.id === session.id);
                if (!existingPrice) {
                  // new session
                  return {
                    sessionId: session.id,
                    status: 'ESTIMATED' as const,
                    price: price.price,
                    reason: price.reason,
                  };
                }

                if (
                  existingPrice?.status === 'CHARGED' ||
                  existingPrice?.status === 'LOCKED' ||
                  existingPrice?.status === 'VOIDED'
                )
                  return;

                if (session.status === 'removed')
                  return {
                    sessionId: session.id,
                    status: 'VOIDED' as const,
                    price: price.price,
                    reason: price.reason,
                  };

                return {
                  sessionId: session.id,
                  status: 'ESTIMATED' as const,
                  price: price.price,
                  reason: price.reason,
                };
              })
              .filter((p) => !!p),
          },
        },
      ];
    }

    case 'ADD_COVERAGE':
      return [{ type: 'COVERAGE_ADDED', data: { type: 'discount', sessionsCount: cmd.data.sessionCount } }];

    case 'MARK_PRICE_AS_CHARGED': {
      const price = state.prices.find((p) => p.id === cmd.data.id);
      if (!price) throw new Error('Price not found');
      if (price.status !== 'ESTIMATED') return [];
      return [{ type: 'PRICE_MARKED_AS_CHARGED', data: { id: cmd.data.id } }];
    }

    default: {
      const _exhaustive: never = cmd;
      return _exhaustive;
    }
  }
}

function getWlmPrice(number: number, state: State) {
  // if (number === 1) return { price: 0, reason: 'first_session' };
  return { price: 0, reason: 'first_session' } as const;

  // if (!state.subscription || state.subscription.status !== 'active') throw new Error('Active subscription not found');
  // return { price: 0, reason: 'subscription' };
}

function getPsychotherapyPrice(number: number) {
  if (number === 1) return { price: 0, reason: 'first_session' } as const;
  return { price: 4500, reason: 'path_standard' } as const;
}
