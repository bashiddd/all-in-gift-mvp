import '@shopify/ui-extensions/preact';
import { render } from "preact";
import { useState } from "preact/hooks";

export default async () => {
  render(<GiftOptions />, document.body);
};

function GiftOptions() {
  const [isEGift, setIsEGift] = useState(false);

  const canUpdate = shopify.instructions.value.attributes?.canUpdateAttributes;
  if (canUpdate === false) return null;

  async function handleEGiftToggle(e) {
    const checked = e.target.checked;
    setIsEGift(checked);
    await shopify.applyAttributeChange({
      type: "updateAttribute",
      key: "egift_enabled",
      value: checked ? "true" : "false",
    });
  }

  return (
    <s-section heading="eギフトオプション">
      <s-stack direction="block" gap="base">
        <s-checkbox
          label="eギフトとして贈る（受取人が住所を入力します）"
          checked={isEGift}
          onChange={handleEGiftToggle}
        />
        {isEGift && (
          <s-text appearance="subdued">
            注文確定後、受取人に共有するギフトURLが発行されます。受取人がURLにアクセスして配送先を入力します。
          </s-text>
        )}
      </s-stack>
    </s-section>
  );
}
