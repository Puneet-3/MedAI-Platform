export class InferenceError extends Error {
  constructor(message: string, public status = 503) { super(message); }
}
export async function inference<T>(path: string, body?: unknown, timeout = 15000): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${process.env.FASTAPI_URL || "http://localhost:8080"}${path}`, {
      method: body === undefined ? "GET" : "POST",
      headers: { "Content-Type": "application/json", "X-FastAPI-Secret": process.env.FASTAPI_SECRET || "" },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal: AbortSignal.timeout(timeout), cache: "no-store",
    });
  } catch { throw new InferenceError("The assistant service is unavailable. Please try again shortly."); }
  if (!response.ok) {
    if (response.status === 501) throw new InferenceError("Assistant editing and retraining are unavailable on this host. Update the local project and redeploy to apply changes.", 501);
    if (response.status === 400 || response.status === 422) throw new InferenceError("Please check your input and try again.", 400);
    if (response.status === 409) throw new InferenceError("Training is already in progress. Please wait for it to finish.", 409);
    throw new InferenceError("This service is unavailable. You can still save reports or request a consultation.");
  }
  return response.json() as Promise<T>;
}
