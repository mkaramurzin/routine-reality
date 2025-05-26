import {
  clerkMiddleware,
  createRouteMatcher,
  auth,
} from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/test-cron",
  "/api/cron/serve-tasks",
  "/api/cron/midnight-cleanup",
  "/api/routines(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  const user = auth();
  const userId = (await user).userId;
  const url = new URL(request.url);

  // Allow specific cron endpoints without any auth checks
  if (url.pathname === "/api/test-cron" || 
      url.pathname === "/api/debug-midnight" ||
      url.pathname === "/api/cron/serve-tasks" ||
      url.pathname === "/api/cron/midnight-cleanup") {
    return NextResponse.next();
  }

  // If this is a public route, allow it to proceed
  if (isPublicRoute(request)) {
    // For API routes, always allow them to proceed to their handlers
    if (url.pathname.startsWith("/api/")) {
      return NextResponse.next();
    }
    // For authenticated users visiting public pages (except home), redirect to dashboard
    if (userId && url.pathname !== "/") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    // For unauthenticated users or home page, allow access
    return NextResponse.next();
  }

  // Protect non-public routes - require authentication
  await auth.protect();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
