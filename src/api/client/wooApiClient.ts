import { request } from '@playwright/test';

export class WooApiClient {
  private authParams() {
    return {
      consumer_key: process.env.CONSUMER_KEY!,
      consumer_secret: process.env.CONSUMER_SECRET!,
    };
  }

  async post<T>(endpoint: string, data: unknown): Promise<T> {
    const ctx = await request.newContext({ baseURL: process.env.site_url });
    try {
      const response = await ctx.post(endpoint, {
        data,
        params: this.authParams(),
      });
      const body = await response.json();
      if (!response.ok()) {
        console.log(JSON.stringify(body, null, 2));
        throw new Error(`POST ${endpoint} failed with status ${response.status()}`);
      }
      return body as T;
    } finally {
      await ctx.dispose();
    }
  }

  async get<T>(endpoint: string, params: Record<string, unknown> = {}): Promise<T> {
    const ctx = await request.newContext({ baseURL: process.env.site_url });
    try {
      const response = await ctx.get(endpoint, {
        params: { ...this.authParams(), ...params },
      });
      const body = await response.json();
      if (!response.ok()) {
        console.log(JSON.stringify(body, null, 2));
        throw new Error(`GET ${endpoint} failed with status ${response.status()}`);
      }
      return body as T;
    } finally {
      await ctx.dispose();
    }
  }

  async getPage<T>(endpoint: string, params: Record<string, unknown> = {}): Promise<{ data: T[]; totalPages: number }> {
    const ctx = await request.newContext({ baseURL: process.env.site_url });
    try {
      const response = await ctx.get(endpoint, {
        params: { ...this.authParams(), ...params },
      });
      const body = await response.json();
      if (!response.ok()) {
        console.log(JSON.stringify(body, null, 2));
        throw new Error(`GET ${endpoint} failed with status ${response.status()}`);
      }
      const totalPages = Number(response.headers()['x-wp-totalpages'] ?? 1);
      return { data: body as T[], totalPages };
    } finally {
      await ctx.dispose();
    }
  }

  async put<T>(endpoint: string, data: unknown): Promise<T> {
    const ctx = await request.newContext({ baseURL: process.env.site_url });
    try {
      const response = await ctx.put(endpoint, {
        data,
        params: this.authParams(),
      });
      const body = await response.json();
      if (!response.ok()) {
        console.log(JSON.stringify(body, null, 2));
        throw new Error(`PUT ${endpoint} failed with status ${response.status()}`);
      }
      return body as T;
    } finally {
      await ctx.dispose();
    }
  }
}

export const wooApiClient = new WooApiClient();
