/**
 * Return a object with fake data, depending on the endpoint and queryParams called.
 *
 *
 * @param {string} endpoint The endpoint to fetch data from.
 * @param {string[]} queryParams An array of query parameters to include in the URL.
 * @returns {any} A object with fake data
 */
export function fetchFakeData(endpoint: string, queryParams: string[]): any {
  if (endpoint.includes('thin_wallet/address_balance')) {
    return {
      success: true,
      total_transactions: 4,
      tokens_data: {
        '00': {
          received: 50000,
          spent: 10000,
          name: 'Hathor',
          symbol: 'HTR',
        },
      },
    }
  }
  if (queryParams[1]?.includes('max_withdrawal')) {
    const key = queryParams[1]?.split('=')[1] || 'defaultKey'
    return {
      calls: {
        [key]: {
          value: 10000,
        },
      },
    }
  } else if (queryParams[1]?.includes('front_end_api_user')) {
    const key = queryParams[1]?.split('=')[1] || 'defaultKey'
    return {
      calls: {
        [key]: {
          value: {
            user_deposit_a: 123,
            user_deposit_b: 123,
            rewards_user_dzr: 123,
          },
        },
      },
    }
  }
}
