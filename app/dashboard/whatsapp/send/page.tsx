import { redirect } from "next/navigation";
import { createWhatsAppUrl } from "../../../../lib/whatsapp";

export default async function WhatsAppSendPage({
  searchParams,
}: {
  searchParams: Promise<{
    id?: string;
    phone?: string;
    message?: string;
  }>;
}) {
  const { phone, message } = await searchParams;

  if (!phone || !message) {
    redirect("/dashboard/relationships");
  }

  redirect(createWhatsAppUrl(phone, message));
}