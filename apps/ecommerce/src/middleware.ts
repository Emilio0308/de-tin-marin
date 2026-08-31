import { type NextRequest } from "next/server";
import { getMiddlewareSupabaseConfig } from "@de-tin-marin/db/config";
import { updateSession } from "@de-tin-marin/db/proxy";

export async function middleware(request: NextRequest) {
  return updateSession(request, {
    ...getMiddlewareSupabaseConfig(),
    app: "ecommerce",
    redirectIfUnauthed: false,
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
