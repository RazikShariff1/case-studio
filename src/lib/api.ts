import { NextResponse } from "next/server";
import { ZodError } from "zod";

export const ok = (data: unknown, status = 200) => NextResponse.json(data, { status });
export const fail = (message: string, status = 400, extra?: object) =>
  NextResponse.json({ error: message, ...extra }, { status });

export function handleError(e: unknown) {
  if (e instanceof ZodError) {
    return fail(e.issues[0]?.message ?? "Invalid input", 422, {
      fields: Object.fromEntries(e.issues.map((i) => [i.path.join("."), i.message])),
    });
  }
  if (e instanceof HttpError) return fail(e.message, e.status);
  console.error(e);
  return fail("Something went wrong", 500);
}

export class HttpError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

export async function readJson(req: Request) {
  try {
    return await req.json();
  } catch {
    throw new HttpError("Invalid JSON body", 400);
  }
}
