import type { CSSProperties } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { Form, useActionData, useLoaderData } from "react-router";
import db from "../db.server";

const ORDER_UPDATE_MUTATION = `
  mutation orderUpdate($input: OrderInput!) {
    orderUpdate(input: $input) {
      order {
        id
        shippingAddress {
          firstName
          lastName
          address1
          city
          province
          zip
          country
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

async function updateShippingAddress(
  shop: string,
  orderId: string,
  address: {
    firstName: string;
    lastName: string;
    address1: string;
    city: string;
    province: string;
    zip: string;
    countryCode: string;
  }
) {
  const session = await db.session.findFirst({ where: { shop } });
  if (!session) {
    console.error(`No session found for shop: ${shop}`);
    return;
  }

  const gid = `gid://shopify/Order/${orderId}`;
  const res = await fetch(
    `https://${shop}/admin/api/2026-04/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": session.accessToken,
      },
      body: JSON.stringify({
        query: ORDER_UPDATE_MUTATION,
        variables: {
          input: {
            id: gid,
            shippingAddress: address,
          },
        },
      }),
    }
  );

  const json = await res.json() as {
    data?: { orderUpdate?: { userErrors?: { field: string; message: string }[] } };
  };
  const errors = json.data?.orderUpdate?.userErrors;
  if (errors && errors.length > 0) {
    console.error("orderUpdate userErrors:", JSON.stringify(errors));
  } else {
    console.log(`Shipping address updated for order ${orderId}`);
  }
}

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const token = await db.giftToken.findUnique({
    where: { token: params.token },
  });

  if (!token) {
    throw new Response("ギフトURLが見つかりません", { status: 404 });
  }

  if (token.status === "claimed") {
    return { status: "claimed" as const };
  }

  return { status: "pending" as const, tokenId: token.id };
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const token = await db.giftToken.findUnique({
    where: { token: params.token },
  });

  if (!token || token.status === "claimed") {
    return { error: "このギフトURLは無効です" };
  }

  const formData = await request.formData();
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const address1 = String(formData.get("address1") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const province = String(formData.get("province") ?? "").trim();
  const zip = String(formData.get("zip") ?? "").trim();
  const country = String(formData.get("country") ?? "JP").trim();

  if (!firstName || !lastName || !address1 || !city || !zip) {
    return { error: "必須項目をすべて入力してください" };
  }

  await db.giftToken.update({
    where: { token: params.token },
    data: { status: "claimed" },
  });

  await updateShippingAddress(token.shop, token.orderId, {
    firstName,
    lastName,
    address1,
    city,
    province,
    zip,
    countryCode: country,
  });

  console.log(`Gift claimed for order ${token.orderId}: ${lastName} ${firstName}, ${zip} ${city} ${address1}`);

  return { success: true, name: `${lastName} ${firstName}` };
};

export default function GiftClaimPage() {
  const data = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  if (data.status === "claimed") {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.heading}>住所登録済み</h1>
          <p style={styles.text}>このギフトURLはすでに使用済みです。</p>
        </div>
      </div>
    );
  }

  if (actionData && "success" in actionData && actionData.success) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.heading}>登録完了</h1>
          <p style={styles.text}>
            {actionData.name} 様の住所を受け付けました。
          </p>
          <p style={styles.subText}>商品の発送をお待ちください。</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.heading}>ギフトの受け取り</h1>
        <p style={styles.text}>配送先の住所を入力してください。</p>

        {actionData && "error" in actionData && (
          <p style={styles.error}>{actionData.error}</p>
        )}

        <Form method="post" style={styles.form}>
          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>姓 *</label>
              <input name="lastName" required style={styles.input} />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>名 *</label>
              <input name="firstName" required style={styles.input} />
            </div>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>郵便番号 *</label>
            <input name="zip" required placeholder="000-0000" style={styles.input} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>都道府県 *</label>
            <input name="province" style={styles.input} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>市区町村 *</label>
            <input name="city" required style={styles.input} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>番地・建物名 *</label>
            <input name="address1" required style={styles.input} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>国コード *</label>
            <input name="country" required placeholder="JP" defaultValue="JP" style={styles.input} />
          </div>
          <button type="submit" style={styles.button}>
            住所を登録する
          </button>
        </Form>
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f5f5f5",
    padding: "16px",
  },
  card: {
    background: "#fff",
    borderRadius: "8px",
    padding: "32px",
    maxWidth: "480px",
    width: "100%",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  },
  heading: {
    fontSize: "22px",
    fontWeight: "bold",
    marginBottom: "8px",
  },
  text: {
    color: "#444",
    marginBottom: "24px",
  },
  subText: {
    color: "#888",
    fontSize: "14px",
  },
  error: {
    color: "#c00",
    marginBottom: "16px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  row: {
    display: "flex",
    gap: "12px",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    gap: "4px",
  },
  label: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#333",
  },
  input: {
    border: "1px solid #ccc",
    borderRadius: "4px",
    padding: "8px 12px",
    fontSize: "14px",
    outline: "none",
  },
  button: {
    background: "#000",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    padding: "12px",
    fontSize: "16px",
    cursor: "pointer",
    marginTop: "8px",
  },
};
