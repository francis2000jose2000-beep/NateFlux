import { NextResponse } from "next/server";
import type { ScanApiRequest, ScanApiResponse } from "@/shared/scanTypes";
import { ScanError, scanRepository } from "@/server/scan";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseRequest(body: unknown): ScanApiRequest | null {
  if (!isObject(body)) return null;
  const repoUrl = typeof body.repoUrl === "string" ? body.repoUrl : null;
  if (!repoUrl) return null;
  const ref = typeof body.ref === "string" ? body.ref : undefined;
  const subpath = typeof body.subpath === "string" ? body.subpath : undefined;
  const scanner = body.scanner === "checkov" || body.scanner === "mock" ? body.scanner : undefined;
  return { repoUrl, ref, subpath, scanner };
}

function json(status: number, payload: ScanApiResponse) {
  return NextResponse.json(payload, { status });
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json(400, { ok: false, error: { code: "INVALID_URL", message: "Invalid JSON body." } });
  }

  const parsed = parseRequest(body);
  if (!parsed) {
    return json(400, { ok: false, error: { code: "INVALID_URL", message: "Missing repoUrl." } });
  }

  try {
    const report = await scanRepository({
      repoUrl: parsed.repoUrl,
      ref: parsed.ref,
      subpath: parsed.subpath,
      scanner: parsed.scanner,
    });
    return json(200, { ok: true, report });
  } catch (e) {
    if (e instanceof ScanError) {
      const status =
        e.code === "INVALID_URL" ? 400 : e.code === "NO_TERRAFORM" ? 422 : e.code === "TIMEOUT" ? 504 : 500;
      return json(status, { ok: false, error: { code: e.code, message: e.message } });
    }
    return json(500, { ok: false, error: { code: "SCAN_FAILED", message: "Unexpected server error." } });
  }
}

