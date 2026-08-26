import { NextRequest, NextResponse } from "next/server";
import { configuredPdfBackendCandidates } from "@/lib/backend-service-url";
import { verifyFirebaseIdToken } from "@/lib/firebase-token";

const BILLING_TIMEOUT_MS = 12000;

export async function billingIdentity(request: NextRequest) {
  const authorization = request.headers.get("authorization") || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  if (!token) throw new Error("AUTH_REQUIRED");
  try { return await verifyFirebaseIdToken(token); }
  catch { throw new Error("AUTH_INVALID"); }
}

function internalToken() { return (process.env.AJN_BILLING_INTERNAL_TOKEN || "").trim(); }

export async function proxyBilling(
  request: NextRequest,
  path: string,
  init?: { method?: "GET" | "POST"; body?: unknown },
) {
  let identity;
  try { identity = await billingIdentity(request); }
  catch(error) {
    const code = error instanceof Error ? error.message : "";
    return NextResponse.json(
      { error: code === "AUTH_REQUIRED" ? "Sign in is required." : "Your session is invalid or expired." },
      { status:401, headers:{ "Cache-Control":"no-store" } },
    );
  }

  const secret = internalToken();
  if (!secret) return NextResponse.json({ error:"Billing is temporarily unavailable." }, { status:503, headers:{ "Cache-Control":"no-store" } });

  const candidates = configuredPdfBackendCandidates(true);
  for (const base of candidates) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), BILLING_TIMEOUT_MS);
    try {
      const response = await fetch(`${base}${path}`, {
        method:init?.method || "GET",
        headers:{
          "Content-Type":"application/json",
          "X-AJN-Internal-Token":secret,
          "X-AJN-User-UID":identity.uid,
          "X-AJN-User-Email":identity.email,
        },
        body:init?.body === undefined ? undefined : JSON.stringify(init.body),
        cache:"no-store",
        redirect:"error",
        signal:controller.signal,
      });
      const text = await response.text();
      if (response.status >= 500) continue;
      return new NextResponse(text || "{}", {
        status:response.status,
        headers:{ "Content-Type":"application/json; charset=utf-8", "Cache-Control":"no-store" },
      });
    } catch {
      // Try the next configured backend candidate.
    } finally {
      clearTimeout(timer);
    }
  }
  return NextResponse.json({ error:"AJN PDF billing service is temporarily unavailable." }, { status:503, headers:{ "Cache-Control":"no-store" } });
}
