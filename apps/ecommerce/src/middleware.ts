import { type NextRequest } from "next/server";
import { updateSession } from "@de-tin-marin/db/proxy";
import { supabaseConfig } from "@/config/env";

export async function middleware(request: NextRequest) {
  return updateSession(request, {
    ...supabaseConfig,
    redirectIfUnauthed: false,
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
