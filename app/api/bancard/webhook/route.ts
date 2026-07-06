import { NextResponse } from "next/server";

import {
  isApprovedBancardPayment,
  isValidBancardConfirmOperation,
  type BancardConfirmOperation,
} from "../../../../lib/bancard";
import { createSupabaseAdminClient } from "../../../../lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const operation = body.operation as BancardConfirmOperation | undefined;

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

    if (!isValidBancardConfirmOperation(operation)) {
      console.error("Invalid Bancard token", operation);

      return NextResponse.json(
        {
          status: "error",
        },
        {
          status: 401,
        },
      );
    }

    const shopProcessId = Number(operation.shop_process_id);
    const admin = createSupabaseAdminClient();

    const { data: payment, error: paymentError } = await admin
      .from("billing_payments")
      .select("*")
      .eq("shop_process_id", shopProcessId)
      .single();

    if (paymentError || !payment) {
      console.error(paymentError);

      return NextResponse.json(
        {
          status: "error",
        },
        {
          status: 404,
        },
      );
    }

    const approved = isApprovedBancardPayment(operation);

    const responseDescription =
      operation.response_description ||
      operation.extended_response_description ||
      operation.response_details ||
      null;

    const ticketNumber =
      operation.ticket_number === undefined || operation.ticket_number === null
        ? null
        : String(operation.ticket_number);

    await admin
      .from("billing_payments")
      .update({
        status: approved ? "paid" : "rejected",
        response_code: operation.response_code || null,
        response_description: responseDescription,
        authorization_number: operation.authorization_number || null,
        ticket_number: ticketNumber,
        raw_payload: body,
        confirmed_at: new Date().toISOString(),
      })
      .eq("shop_process_id", shopProcessId);

    if (approved) {
      await admin
        .from("profiles")
        .update({
          subscription_status: "active",
          plan_type: payment.plan_type,
        })
        .eq("id", payment.user_id);
    }

    return NextResponse.json({
      status: "success",
    });
  } catch (error) {
    console.error(error);

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