import MobileActionBar from "../components/MobileActionBar";

import {
  hasPlatformAccess,
  type ProfileAccess,
} from "../../lib/access-control";

import { createAuthServerClient } from "../../lib/supabase/auth-server";

export const metadata = {
  title: "ClienteYA Dashboard",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase =
    await createAuthServerClient();

  const {
    data: { user },
  } =
    await supabase.auth.getUser();

  let limitedAccess = false;

  if (user) {
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

    limitedAccess =
      !access.allowed;
  }

  return (
    <>
      <div className="pb-20 lg:pb-0">
        {children}
      </div>

      <MobileActionBar
        limitedAccess={limitedAccess}
      />
    </>
  );
}