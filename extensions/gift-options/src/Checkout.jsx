import '@shopify/ui-extensions/preact';
import { render } from "preact";
import { useState } from "preact/hooks";

export default async () => {
  render(<GiftOptions />, document.body);
};

function GiftOptions() {
  const [isGift, setIsGift] = useState(false);
  const [message, setMessage] = useState("");
  const [wrapping, setWrapping] = useState(false);

  const canUpdate = shopify.instructions.value.attributes?.canUpdateAttributes;
  if (canUpdate === false) return null;

  const maxLength = shopify.settings?.value?.max_message_length ?? 200;
  const wrappingEnabled = shopify.settings?.value?.wrapping_enabled ?? false;

  async function handleGiftToggle(e) {
    const checked = e.target.checked;
    setIsGift(checked);
    await shopify.applyAttributeChange({
      type: "updateAttribute",
      key: "gift_enabled",
      value: checked ? "true" : "false",
    });
    if (!checked) {
      setMessage("");
      setWrapping(false);
      await shopify.applyAttributeChange({ type: "updateAttribute", key: "gift_message", value: "" });
      await shopify.applyAttributeChange({ type: "updateAttribute", key: "gift_wrapping", value: "false" });
    }
  }

  async function handleMessageInput(e) {
    const val = e.target.value;
    setMessage(val);
    await shopify.applyAttributeChange({
      type: "updateAttribute",
      key: "gift_message",
      value: val,
    });
  }

  async function handleWrappingChange(e) {
    const checked = e.target.checked;
    setWrapping(checked);
    await shopify.applyAttributeChange({
      type: "updateAttribute",
      key: "gift_wrapping",
      value: checked ? "true" : "false",
    });
  }

  return (
    <s-section heading="ギフトオプション">
      <s-stack direction="block" gap="base">
        <s-checkbox
          label="ギフトとして贈る"
          checked={isGift}
          onChange={handleGiftToggle}
        />
        {isGift && (
          <s-stack direction="block" gap="base">
            <s-text-field
              label={`メッセージ（最大${maxLength}文字）`}
              value={message}
              onInput={handleMessageInput}
              multiline={4}
              maxLength={maxLength}
            />
            {wrappingEnabled && (
              <s-checkbox
                label="ラッピングを希望する"
                checked={wrapping}
                onChange={handleWrappingChange}
              />
            )}
          </s-stack>
        )}
      </s-stack>
    </s-section>
  );
}
