import { useEffect, useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { useFetcher, useLoaderData } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  const settings = await prisma.giftSettings.findUnique({
    where: { shop: session.shop },
  });

  return {
    enabled: settings?.enabled ?? true,
    maxMessageLength: settings?.maxMessageLength ?? 200,
    wrappingEnabled: settings?.wrappingEnabled ?? false,
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();

  const enabled = formData.get("enabled") === "true";
  const maxMessageLength = Number(formData.get("maxMessageLength")) || 200;
  const wrappingEnabled = formData.get("wrappingEnabled") === "true";

  await prisma.giftSettings.upsert({
    where: { shop: session.shop },
    create: {
      shop: session.shop,
      enabled,
      maxMessageLength,
      wrappingEnabled,
    },
    update: {
      enabled,
      maxMessageLength,
      wrappingEnabled,
    },
  });

  return { success: true };
};

export default function GiftSettingsPage() {
  const loaderData = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const shopify = useAppBridge();

  const [enabled, setEnabled] = useState(loaderData.enabled);
  const [maxMessageLength, setMaxMessageLength] = useState(
    loaderData.maxMessageLength,
  );
  const [wrappingEnabled, setWrappingEnabled] = useState(
    loaderData.wrappingEnabled,
  );

  const isLoading = ["loading", "submitting"].includes(fetcher.state);

  useEffect(() => {
    if (fetcher.data?.success) {
      shopify.toast.show("保存しました");
    }
  }, [fetcher.data?.success, shopify]);

  const handleSave = () => {
    fetcher.submit(
      {
        enabled: String(enabled),
        maxMessageLength: String(maxMessageLength),
        wrappingEnabled: String(wrappingEnabled),
      },
      { method: "POST" },
    );
  };

  return (
    <s-page heading="ギフト設定">
      <s-button
        slot="primary-action"
        onClick={handleSave}
        {...(isLoading ? { loading: true } : {})}
      >
        保存
      </s-button>

      <s-section heading="基本設定">
        <s-stack direction="block" gap="base">
          <s-checkbox
            checked={enabled}
            label="ギフト機能を有効にする"
            onChange={(e) => setEnabled(e.currentTarget.checked)}
          />
          <s-checkbox
            checked={wrappingEnabled}
            label="ラッピングを有効にする"
            onChange={(e) => setWrappingEnabled(e.currentTarget.checked)}
          />
          <s-text-field
            label="メッセージ最大文字数"
            value={String(maxMessageLength)}
            onInput={(e) => {
              const val = parseInt(e.currentTarget.value, 10);
              if (!isNaN(val) && val > 0) setMaxMessageLength(val);
            }}
          />
        </s-stack>
      </s-section>
    </s-page>
  );
}
