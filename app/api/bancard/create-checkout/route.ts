import { NextResponse } from "next/server";

import {
  createBancardSingleBuy,
  getBancardCheckoutUrl,
  getPlanAmount,
  getPlanDescription,
  type BancardPlanType,
} from "../../../../lib/bancard";
import { createAuthServerClient } from "../../../../lib/supabase/auth-server";
import { createSupabaseAdminClient } from "../../../../lib/supabase/admin";

type BillingCycle = "monthly" | "yearly";

function getCheckoutAmount(
  plan: BancardPlanType,
  billingCycle: BillingCycle,
): number {
  if (plan === "pro") {
    if (billingCycle === "yearly") {
      return 2000000;
    }

    return getPlanAmount(plan);
  }

  throw new Error(
    "Enterprise plan requires manual commercial agreement.",
  );
}

function getCheckoutDescription(
  plan: BancardPlanType,
  billingCycle: BillingCycle,
): string {
  const baseDescription =
    getPlanDescription(plan);

  if (plan === "pro") {
    return billingCycle === "yearly"
      ? `${baseDescription} · Anual`
      : `${baseDescription} · Mensual`;
  }

  return baseDescription;
}

export async function POST(
  req: Request,
) {
  try {
    const supabase =
      await createAuthServerClient();

    const {
      data: { user },
      error: userError,
    } =
      await supabase.auth.getUser();

    if (
      userError ||
      !user
    ) {
      return NextResponse.json(
        {
          error: "Unauthorized.",
        },
        {
          status: 401,
        },
      );
    }

    const body =
      await req.json();

    const plan =
      body.plan as
        | BancardPlanType
        | undefined;

    const billingCycle =
      body.billingCycle as
        | BillingCycle
        | undefined;

    if (!plan) {
      return NextResponse.json(
        {
          error: "Missing plan.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      billingCycle !== "monthly" &&
      billingCycle !== "yearly"
    ) {
      return NextResponse.json(
        {
          error: "Invalid billing cycle.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      plan === "enterprise"
    ) {
      return NextResponse.json(
        {
          error:
            "Enterprise requires commercial approval.",
        },
        {
          status: 400,
        },
      );
    }

    const amount =
      getCheckoutAmount(
        plan,
        billingCycle,
      );

    const description =
      getCheckoutDescription(
        plan,
        billingCycle,
      );

    const shopProcessId =
      Date.now();

    const appUrl =
      process.env
        .NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";

    const admin =
      createSupabaseAdminClient();

    const {
      error: insertError,
    } =
      await admin
        .from(
          "billing_payments",
        )
        .insert({
          user_id:
            user.id,

          shop_process_id:
            shopProcessId,

          plan_type:
            plan,

          billing_cycle:
            billingCycle,

          amount,

          currency:
            "PYG",

          status:
            "pending",
        });

    if (insertError) {
      console.error(
        insertError,
      );

      return NextResponse.json(
        {
          error:
            "Could not register payment intent.",
        },
        {
          status: 500,
        },
      );
    }

    const response =
      await createBancardSingleBuy({
        shopProcessId,
        amount,
        description,
        returnUrl: `${appUrl}/dashboard/billing?payment=success`,
        cancelUrl: `${appUrl}/dashboard/billing?payment=cancelled`,
      });

    if (
      response.status !==
        "success" ||
      !response.process_id
    ) {
      await admin
        .from(
          "billing_payments",
        )
        .update({
          status:
            "checkout_failed",

          raw_payload:
            response,
        })
        .eq(
          "shop_process_id",
          shopProcessId,
        );

      return NextResponse.json(
        {
          error:
            "Could not create Bancard checkout.",

          bancard:
            response,
        },
        {
          status: 500,
        },
      );
    }

    await admin
      .from(
        "billing_payments",
      )
      .update({
        bancard_process_id:
          response.process_id,
      })
      .eq(
        "shop_process_id",
        shopProcessId,
      );

    const checkoutUrl =
      getBancardCheckoutUrl(
        response.process_id,
      );

    return NextResponse.json({
      success: true,
      processId:
        response.process_id,
      shopProcessId,
      checkoutUrl,
    });
  } catch (error) {
    console.error(
      error,
    );

    return NextResponse.json(
      {
        error:
          "Internal server error.",
      },
      {
        status: 500,
      },
    );
  }
}