import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  const tokens = await db.giftToken.findMany({
    where: { shop: session.shop },
    orderBy: { createdAt: "desc" },
  });

  const appUrl = process.env.SHOPIFY_APP_URL ?? "";

  return {
    tokens: tokens.map((t) => ({
      id: t.id,
      orderId: t.orderId,
      token: t.token,
      status: t.status,
      giftUrl: `${appUrl}/gift/${t.token}`,
      createdAt: t.createdAt.toISOString(),
    })),
  };
};

export default function EGiftOrdersPage() {
  const { tokens } = useLoaderData<typeof loader>();

  return (
    <s-page heading="eギフト一覧">
      <s-section>
        {tokens.length === 0 ? (
          <s-paragraph>eギフト注文はまだありません。</s-paragraph>
        ) : (
          <s-table>
            <s-table-header-row>
              <s-table-header>注文ID</s-table-header>
              <s-table-header>ステータス</s-table-header>
              <s-table-header>ギフトURL</s-table-header>
              <s-table-header>発行日時</s-table-header>
            </s-table-header-row>
            <s-table-body>
              {tokens.map((t) => (
                <s-table-row key={t.id}>
                  <s-table-cell>{t.orderId}</s-table-cell>
                  <s-table-cell>
                    {t.status === "claimed" ? "住所登録済み" : "未受取"}
                  </s-table-cell>
                  <s-table-cell>
                    <a href={t.giftUrl} target="_blank" rel="noreferrer">
                      {t.giftUrl}
                    </a>
                  </s-table-cell>
                  <s-table-cell>
                    {new Date(t.createdAt).toLocaleString("ja-JP")}
                  </s-table-cell>
                </s-table-row>
              ))}
            </s-table-body>
          </s-table>
        )}
      </s-section>
    </s-page>
  );
}
