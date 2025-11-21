import { toast } from "sonner";
/* Centralized, typed API client with retries, timeout, and auth header.
 * Works in both server and browser. Uses bearer token from localStorage when available.
 */

export class ApiError<T = any> extends Error {
  status: number;
  data?: T;
  constructor(message: string, status: number, data?: T) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export interface ApiClientOptions {
  baseUrl?: string;
  retries?: number; // total attempts minus the initial request (e.g., 2 = 1 initial + 2 retries)
  retryDelayMs?: number; // base delay for backoff
  timeoutMs?: number;
  defaultHeaders?: Record<string, string>;
}

export interface RequestOptions {
  method?: HttpMethod;
  headers?: Record<string, string>;
  query?: Record<string, string | number | boolean | undefined | null>;
  body?: any;
  formData?: FormData; // when provided, content-type is managed by browser
  signal?: AbortSignal;
  parseJson?: boolean; // default true when Content-Type is json
  retries?: number; // override per request
  timeoutMs?: number; // override per request
}

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

function buildQuery(query?: RequestOptions["query"]) {
  if (!query) return "";
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null) continue;
    params.append(k, String(v));
  }
  const s = params.toString();
  return s ? `?${s}` : "";
}

function getBearerToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem("bearer_token");
  } catch {
    return null;
  }
}

export class APIClient {
  private baseUrl: string;
  private retries: number;
  private retryDelayMs: number;
  private timeoutMs: number;
  private defaultHeaders: Record<string, string>;

  constructor(opts: ApiClientOptions = {}) {
    this.baseUrl = opts.baseUrl ?? ""; // always use relative paths by default
    this.retries = Math.max(0, opts.retries ?? 2);
    this.retryDelayMs = opts.retryDelayMs ?? 400;
    this.timeoutMs = opts.timeoutMs ?? 15000;
    this.defaultHeaders = opts.defaultHeaders ?? { "Accept": "application/json" };
  }

  private withTimeout<T>(prom: Promise<T>, ms: number, signal?: AbortSignal): Promise<T> {
    if (signal?.aborted) return Promise.reject(new DOMException("Aborted", "AbortError"));
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), ms);
    const race = new Promise<T>((resolve, reject) => {
      prom.then(resolve, reject);
    });
    // Merge signals: if caller signal aborts, propagate
    if (signal) {
      signal.addEventListener("abort", () => controller.abort(), { once: true });
    }
    return Promise.race([
      race,
      new Promise<T>((_, reject) => {
        controller.signal.addEventListener("abort", () => reject(new DOMException("Timeout", "AbortError")), { once: true });
      }),
    ]).finally(() => clearTimeout(id));
  }

  private buildHeaders(extra?: Record<string, string>, hasFormData?: boolean) {
    const headers: Record<string, string> = { ...this.defaultHeaders, ...(extra ?? {}) };
    const token = getBearerToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
    // Let the browser set the Content-Type boundary when using FormData
    if (hasFormData) {
      delete headers["Content-Type"];
    } else if (!headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }
    return headers;
  }

  async request<T = any>(path: string, options: RequestOptions = {}): Promise<T> {
    const url = `${this.baseUrl}${path}${buildQuery(options.query)}`;
    const method = options.method ?? "GET";
    const hasFormData = !!options.formData;
    const headers = this.buildHeaders(options.headers, hasFormData);

    let body: BodyInit | undefined;
    if (hasFormData) {
      body = options.formData as FormData;
    } else if (options.body !== undefined && method !== "GET") {
      body = headers["Content-Type"]?.includes("application/json") ? JSON.stringify(options.body) : options.body;
    }

    const maxRetries = Math.max(0, options.retries ?? this.retries);
    const timeoutMs = options.timeoutMs ?? this.timeoutMs;

    let attempt = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        const response = await this.withTimeout(
          fetch(url, { method, headers, body, signal: options.signal, cache: "no-store" }),
          timeoutMs,
          options.signal
        );

        const contentType = response.headers.get("Content-Type") || "";
        const isJson = contentType.includes("application/json");

        if (!response.ok) {
          // Try to parse error payload if json
          let errorPayload: any = undefined;
          try {
            errorPayload = isJson ? await response.json() : await response.text();
          } catch {
            // ignore parse error
          }

          // Retry on transient errors
          if ([429, 502, 503, 504].includes(response.status) && attempt < maxRetries) {
            attempt++;
            const backoff = this.retryDelayMs * Math.pow(2, attempt - 1) + Math.random() * 200;
            await sleep(backoff);
            continue;
          }

          const message = (errorPayload && (errorPayload.message || errorPayload.error)) || `HTTP ${response.status}`;
          throw new ApiError(message, response.status, errorPayload);
        }

        // Success
        if (options.parseJson === false) {
          // caller wants raw response body as text
          return (await response.text()) as unknown as T;
        }

        if (isJson) {
          return (await response.json()) as T;
        }

        // Fallback to text/blob depending on headers
        const text = await response.text();
        return text as unknown as T;
      } catch (err: any) {
        // Abort errors should not retry further
        const isAbort = err?.name === "AbortError";
        const isNetwork = err instanceof TypeError && !isAbort; // fetch throws TypeError on network errors
        if ((isNetwork || isAbort) && attempt < maxRetries) {
          attempt++;
          const backoff = this.retryDelayMs * Math.pow(2, attempt - 1) + Math.random() * 200;
          await sleep(backoff);
          continue;
        }
        throw err;
      }
    }
  }

  get<T = any>(path: string, options?: Omit<RequestOptions, "method" | "body" | "formData">) {
    return this.request<T>(path, { ...options, method: "GET" });
  }

  post<T = any, B = any>(path: string, body?: B, options?: Omit<RequestOptions, "method" | "body">) {
    return this.request<T>(path, { ...options, method: "POST", body });
  }

  put<T = any, B = any>(path: string, body?: B, options?: Omit<RequestOptions, "method" | "body">) {
    return this.request<T>(path, { ...options, method: "PUT", body });
  }

  patch<T = any, B = any>(path: string, body?: B, options?: Omit<RequestOptions, "method" | "body">) {
    return this.request<T>(path, { ...options, method: "PATCH", body });
  }

  delete<T = any>(path: string, options?: Omit<RequestOptions, "method" | "body" | "formData">) {
    return this.request<T>(path, { ...options, method: "DELETE" });
  }
}

// Default singleton instance
export const apiClient = new APIClient({ retries: 2, retryDelayMs: 400, timeoutMs: 15000 });

// Convenience helpers
export const api = {
  get: <T = any>(path: string, options?: Omit<RequestOptions, "method" | "body" | "formData">) => apiClient.get<T>(path, options),
  post: <T = any, B = any>(path: string, body?: B, options?: Omit<RequestOptions, "method" | "body">) => apiClient.post<T, B>(path, body, options),
  put: <T = any, B = any>(path: string, body?: B, options?: Omit<RequestOptions, "method" | "body">) => apiClient.put<T, B>(path, body, options),
  patch: <T = any, B = any>(path: string, body?: B, options?: Omit<RequestOptions, "method" | "body">) => apiClient.patch<T, B>(path, body, options),
  delete: <T = any>(path: string, options?: Omit<RequestOptions, "method" | "body" | "formData">) => apiClient.delete<T>(path, options),
};

// Additional ergonomic helpers matching the implementation guide
export function apiGet<T = any>(path: string, options?: Omit<RequestOptions, "method" | "body" | "formData">) {
  return apiClient.get<T>(path, options);
}

export function apiPost<T = any, B = any>(path: string, body?: B, options?: Omit<RequestOptions, "method" | "body">) {
  return apiClient.post<T, B>(path, body, options);
}

export function apiPut<T = any, B = any>(path: string, body?: B, options?: Omit<RequestOptions, "method" | "body">) {
  return apiClient.put<T, B>(path, body, options);
}

export function apiPatch<T = any, B = any>(path: string, body?: B, options?: Omit<RequestOptions, "method" | "body">) {
  return apiClient.patch<T, B>(path, body, options);
}

export function apiDelete<T = any>(path: string, options?: Omit<RequestOptions, "method" | "body" | "formData">) {
  return apiClient.delete<T>(path, options);
}

export function isApiError(e: unknown): e is ApiError<any> {
  return e instanceof ApiError;
}

export function handleApiError(err: unknown, fallbackMessage = "Something went wrong") {
  let message = fallbackMessage;
  let status: number | undefined = undefined;

  if (err instanceof ApiError) {
    status = err.status;
    message = err.message || fallbackMessage;
  } else if (err instanceof Error) {
    message = err.message || fallbackMessage;
  }

  // Client-only UX handling
  if (typeof window !== "undefined") {
    try {
      toast.error(message);
    } catch {}

    if (status === 401) {
      const redirect = encodeURIComponent(window.location.pathname + window.location.search);
      // Use client-side navigation to login with redirect back to current page
      window.location.href = `/login?redirect=${redirect}`;
    }
  }

  // Always log for debugging
  // eslint-disable-next-line no-console
  console.error(err);

  return { message, status };
}