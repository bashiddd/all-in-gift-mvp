import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";

type NoteAttribute = { name: string; value: string };

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, topic, payload } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

  const p = payload as {
    id: number | string;
    note_attributes?: NoteAttribute[];
  };

  const orderId = String(p.id);
  const attrs = p.note_attributes ?? [];
  const find = (key: string) => attrs.find((a) => a.name === key)?.value ?? "";

  const giftEnabled = find("gift_enabled") === "true";
  if (!giftEnabled) {
    return new Response();
  }

  const message = find("gift_message") || null;
  const giftWrapping = find("gift_wrapping") === "true";

  await db.giftOrder.upsert({
    where: { orderId },
    create: {
      shop,
      orderId,
      message,
      wrapping: giftWrapping,
    },
    update: {
      message,
      wrapping: giftWrapping,
    },
  });

  console.log(`saved gift order: ${orderId}`);

  return new Response();
};
