// Price service fetch client
const PRICE_SERVICE_URL = process.env.PRICE_SERVICE_URL || 'http://localhost:3000';

type FetchOptions = {
  timeout?: number;
  params?: Record<string, any>;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
};

/**
 * Fetch with timeout support using AbortController
 */
async function fetchWithTimeout(url: string, options: RequestInit & { timeout?: number }): Promise<Response> {
  const { timeout = 5000, ...fetchOptions } = options;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Make a request to the price service API
 */
export async function getPriceServiceData<T = any>(
  endpoint: string, 
  options: FetchOptions = {}
): Promise<T> {
  const { params = {}, timeout = 5000, method = 'GET', body, headers = {} } = options;
  
  // Build URL with query parameters
  const url = new URL(`${PRICE_SERVICE_URL}${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, String(value));
    }
  });
  
  try {
    const fetchOptions: RequestInit & { timeout?: number } = { 
      method,
      timeout,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (body && (method === 'POST' || method === 'PUT' || method === 'DELETE')) {
      fetchOptions.body = JSON.stringify(body);
    }

    const response = await fetchWithTimeout(url.toString(), fetchOptions);
    
    if (!response.ok) {
      // For better error reporting, try to get error details from the response
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(`${response.status} ${response.statusText}: ${JSON.stringify(errorData)}`);
        }
      } catch (parseError) {
        // If we can't parse the response, just use the status
      }
      
      throw new Error(`Failed with status ${response.status}: ${response.statusText}`);
    }
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    return await response.text() as unknown as T;
  } catch (error) {
    console.error(`Error fetching data from price service: ${error}`);
    throw error;
  }
}
