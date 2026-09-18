import { createServerClient } from "@supabase/ssr";

import {
  NextResponse,
  type NextRequest,
} from "next/server";

import {
  hasPlatformAccess,
  type ProfileAccess,
} from "./lib/access-control";

const LIMITED_ACCESS_COOKIE =
  "clienteya_limited_access";

const FOUNDER_MODE_COOKIE =
  "clienteya_founder_mode";

export async function proxy(
  request: NextRequest,
) {
  let response =
    NextResponse.next({
      request,
    });

  const supabase =
    createServerClient(
      process.env
        .NEXT_PUBLIC_SUPABASE_URL!,
      process.env
        .NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },

          setAll(cookiesToSet) {
            cookiesToSet.forEach(
              ({
                name,
                value,
                options,
              }) => {
                request.cookies.set(
                  name,
                  value,
                );

                response.cookies.set(
                  name,
                  value,
                  options,
                );
              },
            );
          },
        },
      },
    );

  const {
    data: { user },
  } =
    await supabase.auth.getUser();

  const pathname =
    request.nextUrl.pathname;

  const isDashboard =
    pathname.startsWith(
      "/dashboard",
    );

  const isBilling =
    pathname.startsWith(
      "/dashboard/billing",
    );

  const isLogin =
    pathname.startsWith(
      "/login",
    );

  if (
    !user &&
    isDashboard
  ) {
    const url =
      request.nextUrl.clone();

    url.pathname =
      "/login";

    const redirectResponse =
      NextResponse.redirect(
        url,
      );

    redirectResponse.cookies.delete(
      LIMITED_ACCESS_COOKIE,
    );

    redirectResponse.cookies.delete(
      FOUNDER_MODE_COOKIE,
    );

    return redirectResponse;
  }

  if (
    user &&
    isLogin
  ) {
    const url =
      request.nextUrl.clone();

    url.pathname =
      "/dashboard";

    return NextResponse.redirect(
      url,
    );
  }

  if (
    user &&
    isDashboard
  ) {
    const {
      data: profileData,
    } =
      await supabase
        .from("profiles")
        .select(
          [
            "email",
            "subscription_status",
            "trial_ends_at",
            "plan_type",
            "subscription_started_at",
            "subscription_ends_at",
            "payment_provider",
            "payment_reference",
          ].join(","),
        )
        .eq(
          "id",
          user.id,
        )
        .maybeSingle();

    const profile =
      profileData as
        | ProfileAccess
        | null;

    const profileAccess: ProfileAccess = {
      email:
        profile?.email ||
        user.email ||
        null,

      subscription_status:
        profile?.subscription_status ||
        null,

      trial_ends_at:
        profile?.trial_ends_at ||
        null,

      plan_type:
        profile?.plan_type ||
        null,

      subscription_started_at:
        profile?.subscription_started_at ||
        null,

      subscription_ends_at:
        profile?.subscription_ends_at ||
        null,

      payment_provider:
        profile?.payment_provider ||
        null,

      payment_reference:
        profile?.payment_reference ||
        null,
    };

    const access =
      hasPlatformAccess(
        profileAccess,
      );

    const founderMode =
      access.reason ===
      "founder_mode";

    if (!access.allowed) {
      if (!isBilling) {
        const url =
          request.nextUrl.clone();

        url.pathname =
          "/dashboard/billing";

        const redirectResponse =
          NextResponse.redirect(
            url,
          );

        redirectResponse.cookies.set(
          LIMITED_ACCESS_COOKIE,
          "1",
          {
            path: "/",
            sameSite: "lax",
          },
        );

        redirectResponse.cookies.delete(
          FOUNDER_MODE_COOKIE,
        );

        return redirectResponse;
      }

      response.cookies.set(
        LIMITED_ACCESS_COOKIE,
        "1",
        {
          path: "/",
          sameSite: "lax",
        },
      );

      response.cookies.delete(
        FOUNDER_MODE_COOKIE,
      );

      return response;
    }

    response.cookies.delete(
      LIMITED_ACCESS_COOKIE,
    );

    if (founderMode) {
      response.cookies.set(
        FOUNDER_MODE_COOKIE,
        "1",
        {
          path: "/",
          sameSite: "lax",
        },
      );
    } else {
      response.cookies.delete(
        FOUNDER_MODE_COOKIE,
      );
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/login",
  ],
};