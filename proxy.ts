import { NextResponse, type NextRequest } from "next/server";

function isLocalFounderMode() {
  return (
    process.env.NODE_ENV === "development" &&
    process.env.CLIENTEYA_FOUNDER_MODE !== "false"
  );
}

export default function proxy(req: NextRequest) {
  if (isLocalFounderMode()) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};