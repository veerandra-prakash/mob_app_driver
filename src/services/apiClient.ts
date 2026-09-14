import { APP_CONFIG } from '../config/constants';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  timeoutMs?: number;
}

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const {
    method = 'GET',
    headers = {},
    body,
    timeoutMs = 30000,
  } = options;

  let baseUrl = APP_CONFIG.apiBaseUrl.replace(/\/+$/, '');
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  if (baseUrl.endsWith('/api') && path.startsWith('/api/')) {
    baseUrl = baseUrl.slice(0, -4);
  }

  const url = endpoint.startsWith('http')
    ? endpoint
    : `${baseUrl}${path}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);


  const requestHeaders: Record<string, string> = {
    'Accept': 'application/json',
    ...headers,
  };

  let requestBody: string | undefined = undefined;

  if (body !== undefined) {
    requestHeaders['Content-Type'] = 'application/json';
    requestBody = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: requestBody,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const contentType = response.headers.get('content-type');
    let data: any = null;

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      try {
        data = JSON.parse(text);
      } catch {
        data = { message: text };
      }
    }

    if (!response.ok) {
      throw new ApiError(
        data?.message || data?.error || `HTTP request failed with status ${response.status}`,
        response.status,
        data
      );
    }

    return data as T;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new ApiError(`Request timeout after ${timeoutMs}ms`, 408);
    }
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(error?.message || 'Network request failed', 0);
  }
}
