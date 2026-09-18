import { NextResponse } from "next/server";

import {
  isApprovedBancardPayment,
  isValidBancardConfirmOperation,
  type BancardConfirmOperation,
} from "../../../../lib/bancard";
import { createSupabaseAdminClient } from "../../../../lib/supabase/admin";

type BillingCycle =
  | "monthly"
  | "yearly";

function getSubscriptionEndDate({
  currentEndDate,
  billingCycle,
}: {
  currentEndDate?: string | null;
  billingCycle: BillingCycle;
}) {
  const now = new Date();

  let baseDate = now;

  if (currentEndDate) {
    const existingEnd =
      new Date(currentEndDate);

    if (
      !Number.isNaN(
        existingEnd.getTime(),
      ) &&
      existingEnd > now
    ) {
      baseDate = existingEnd;
    }
  }

  const nextEnd =
    new Date(baseDate);

  if (
    billingCycle ===
    "yearly"
  ) {
    nextEnd.setFullYear(
      nextEnd.getFullYear() + 1,
    );
  } else {
    nextEnd.setMonth(
      nextEnd.getMonth() + 1,
    );
  }

  return nextEnd.toISOString();
}

export async function POST(
  req: Request,
) {
  try {
    const body =
      await req.json();

    const operation =
      body.operation as
        | BancardConfirmOperation
        | undefined;

    if (!operation) {
      return NextResponse.json(
        {
          status: "error",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !isValidBancardConfirmOperation(
        operation,
      )
    ) {
      console.error(
        "Invalid Bancard token",
        operation,
      );

      return NextResponse.json(
        {
          status: "error",
        },
        {
          status: 401,
        },
      );
    }

    const shopProcessId =
      Number(
        operation.shop_process_id,
      );

    const admin =
      createSupabaseAdminClient();

    const {
      data: payment,
      error: paymentError,
    } =
      await admin
        .from(
          "billing_payments",
        )
        .select("*")
        .eq(
          "shop_process_id",
          shopProcessId,
        )
        .single();

    if (
      paymentError ||
      !payment
    ) {
      console.error(
        paymentError,
      );

      return NextResponse.json(
        {
          status: "error",
        },
        {
          status: 404,
        },
      );
    }

    if (
      payment.status ===
      "paid"
    ) {
      return NextResponse.json({
        status: "success",
      });
    }

    const approved =
      isApprovedBancardPayment(
        operation,
      );

    const responseDescription =
      operation.response_description ||
      operation.extended_response_description ||
      operation.response_details ||
      null;

    const ticketNumber =
      operation.ticket_number ===
        undefined ||
      operation.ticket_number ===
        null
        ? null
        : String(
            operation.ticket_number,
          );

    await admin
      .from(
        "billing_payments",
      )
      .update({
        status:
          approved
            ? "paid"
            : "rejected",

        response_code:
          operation.response_code ||
          null,

        response_description:
          responseDescription,

        authorization_number:
          operation.authorization_number ||
          null,

        ticket_number:
          ticketNumber,

        raw_payload:
          body,

        confirmed_at:
          new Date().toISOString(),
      })
      .eq(
        "shop_process_id",
        shopProcessId,
      );

    if (approved) {
      const billingCycle:
        BillingCycle =
          payment.billing_cycle ===
          "yearly"
            ? "yearly"
            : "monthly";

      const {
        data: currentProfile,
        error: profileError,
      } =
        await admin
          .from("profiles")
          .select(
            "id,subscription_status,subscription_started_at,subscription_ends_at,plan_type",
          )
          .eq(
            "id",
            payment.user_id,
          )
          .single();

      if (
        profileError ||
        !currentProfile
      ) {
        console.error(
          profileError,
        );

        return NextResponse.json(
          {
            status: "error",
          },
          {
            status: 500,
          },
        );
      }

      const confirmedAt =
        new Date().toISOString();

      const subscriptionEndsAt =
        getSubscriptionEndDate({
          currentEndDate:
            currentProfile.subscription_ends_at,
          billingCycle,
        });

      const {
        error:
          subscriptionError,
      } =
        await admin
          .from("profiles")
          .update({
            subscription_status:
              "active",

            plan_type:
              payment.plan_type,

            billing_cycle:
              billingCycle,

            subscription_started_at:
              currentProfile.subscription_started_at ||
              confirmedAt,

            subscription_ends_at:
              subscriptionEndsAt,
          })
          .eq(
            "id",
            payment.user_id,
          );

      if (
        subscriptionError
      ) {
        console.error(
          subscriptionError,
        );

        return NextResponse.json(
          {
            status: "error",
          },
          {
            status: 500,
          },
        );
      }

      const {
        data: businessSettings,
      } =
        await admin
          .from(
            "business_settings",
          )
          .select("*")
          .eq(
            "user_id",
            payment.user_id,
          )
          .single();

      await admin
        .from("invoices")
        .insert({
          user_id:
            payment.user_id,

          payment_id:
            payment.id,

          invoice_number:
            `INV-${Date.now()}`,

          plan_type:
            payment.plan_type,

          billing_cycle:
            billingCycle,

          amount:
            payment.amount,

          currency:
            payment.currency,

          status:
            "paid",

          business_name:
            businessSettings?.billing_name ??
            null,

          ruc:
            businessSettings?.billing_ruc ??
            null,

          address:
            businessSettings?.billing_address ??
            null,

          city:
            businessSettings?.billing_city ??
            null,

          email:
            businessSettings?.billing_email ??
            null,

          phone:
            businessSettings?.billing_phone ??
            null,
        });
    }

    return NextResponse.json({
      status: "success",
    });
  } catch (error) {
    console.error(
      error,
    );

    return NextResponse.json(
      {
        status: "error",
      },
      {
        status: 500,
      },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
  });
}