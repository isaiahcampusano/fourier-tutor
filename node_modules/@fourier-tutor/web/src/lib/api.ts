import type {
  CreateSessionResponse,
  LessonStep,
  SubmitAttemptRequest,
  SubmitAttemptResponse,
  WidgetInteraction
} from "@fourier-tutor/shared";

const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, {
    headers: {
      "Content-Type": "application/json",
      "x-device-id": getDeviceId(),
      ...init?.headers
    },
    ...init
  });

  if (!response.ok) {
    throw new Error(`Request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

function getDeviceId() {
  const key = "fourier-tutor-device-id";
  const existing = window.localStorage.getItem(key);
  if (existing) {
    return existing;
  }

  const id = crypto.randomUUID();
  window.localStorage.setItem(key, id);
  return id;
}

export async function createSession() {
  return request<CreateSessionResponse>("/sessions", {
    method: "POST",
    body: JSON.stringify({})
  });
}

export async function getNextStep(sessionId: string) {
  return request<LessonStep>(`/sessions/${sessionId}/next`);
}

export async function submitAttempt(sessionId: string, body: SubmitAttemptRequest) {
  return request<SubmitAttemptResponse>(`/sessions/${sessionId}/attempts`, {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export async function sendInteractions(sessionId: string, events: WidgetInteraction[]) {
  return request<{ accepted: number }>(`/sessions/${sessionId}/interactions`, {
    method: "POST",
    body: JSON.stringify({ events })
  });
}
