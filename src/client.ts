export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

export class ApiClient {
  constructor(
    private readonly apiKey:  string,
    private readonly baseUrl: string,
  ) {}

  private headers(): Record<string, string> {
    return {
      "Authorization": `Bearer ${this.apiKey}`,
      "Content-Type":  "application/json",
      "User-Agent":    "wesender-cli/0.1.0",
    }
  }

  async get<T = unknown>(path: string): Promise<T> {
    const res = await fetch(this.baseUrl + path, { headers: this.headers() })
    return this.handle<T>(res)
  }

  async post<T = unknown>(path: string, body: unknown): Promise<T> {
    const res = await fetch(this.baseUrl + path, {
      method:  "POST",
      headers: this.headers(),
      body:    JSON.stringify(body),
    })
    return this.handle<T>(res)
  }

  async delete<T = unknown>(path: string): Promise<T> {
    const res = await fetch(this.baseUrl + path, {
      method:  "DELETE",
      headers: this.headers(),
    })
    return this.handle<T>(res)
  }

  private async handle<T>(res: Response): Promise<T> {
    const body = await res.json().catch(() => ({}))
    if (!res.ok) {
      const msg = (body as Record<string, string>)?.error
             ?? (body as Record<string, string>)?.message
             ?? `HTTP ${res.status}`
      throw new ApiError(msg, res.status, body)
    }
    return body as T
  }
}
