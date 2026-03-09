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

  const egiftEnabled = find("egift_enabled") === "true";
  if (!egiftEnabled) {
    return new Response();
  }

  await db.giftToken.create({
    data: {
      shop,
      orderId,
    },
  });

  console.log(`created gift token for order: ${orderId}`);

  return new Response();
};
