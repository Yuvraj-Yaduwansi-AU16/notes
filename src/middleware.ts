import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req });

  const { pathname } = req.nextUrl;
  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register");
  console.log("🔹 Pathname:", pathname);
  console.log("🔹 Is auth page:", isAuthPage);

  // 🔹 If user is logged in and tries to access login/register, redirect to home
  if (isAuthPage) {
    console.log("🔹 If user is logged in and tries to access login/register, redirect to home");
    
    if (token) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next(); // Allow access if not logged in
  }

  // 🔹 If accessing a protected page and NOT logged in, redirect to login
  if (!token) {
    console.log("🔹 If accessing a protected page and NOT logged in, redirect to login");
    return NextResponse.redirect(new URL("/login", req.url));
  }
  console.log("🔹 If accessing a protected page and logged in, allow access");

  return NextResponse.next(); // Allow access to protected routes
}

export const config = {
  matcher: [
    "/profile",      // Protect profile page
    "/tasks",        // Protect task list
    "/tasks/create", // Protect task creation
    "/"             // Protect homepage (if user needs to be logged in)
  ],
};
