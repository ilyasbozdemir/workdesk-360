export interface TestRunResult<T = unknown> {
  name: string;
  durationMs: number;
  success: boolean;
  data?: T;
  error?: {
    name?: string;
    code?: string;
    message: string;
    details?: unknown;
    stack?: string;
  };
}

export async function executePlaygroundTest<T>(
  name: string,
  fn: () => Promise<T> | T
): Promise<TestRunResult<T>> {
  const start = performance.now();
  try {
    const rawData = await fn();
    const durationMs = Math.round((performance.now() - start) * 100) / 100;
    const data = rawData !== undefined ? JSON.parse(JSON.stringify(rawData)) : undefined;
    return {
      name,
      durationMs,
      success: true,
      data,
    };
  } catch (err: any) {
    const durationMs = Math.round((performance.now() - start) * 100) / 100;
    return {
      name,
      durationMs,
      success: false,
      error: {
        name: err?.name || "Error",
        code: err?.code,
        message: err?.message || String(err),
        details: err?.details,
        stack: err?.stack,
      },
    };
  }
}
