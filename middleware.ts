import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const user = request.cookies.get("user")?.value;
  const pathname = request.nextUrl.pathname;

  const isAuthPage = pathname.startsWith("/login");
  const isDoctorPage = pathname.startsWith("/doctor");
  const isPatientPage = pathname.startsWith("/patient");

  if (!token && !isAuthPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (token && user) {
    try {
      const userData = JSON.parse(decodeURIComponent(user));
      if (isAuthPage) {
        return NextResponse.redirect(
          new URL(userData.role === "doctor" ? "/doctor" : "/patient", request.url)
        );
      }
      if (isDoctorPage && userData.role !== "doctor") {
        return NextResponse.redirect(new URL("/patient", request.url));
      }
      if (isPatientPage && userData.role !== "patient") {
        return NextResponse.redirect(new URL("/doctor", request.url));
      }
    } catch {
      // Invalid user cookie - clear and redirect to login
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"],
};
