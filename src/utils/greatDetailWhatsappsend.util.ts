import Client from "@great-detail/whatsapp";

const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
if (!WHATSAPP_ACCESS_TOKEN) throw new Error("Whatsapp access token required");

export const whatsappSdk = new Client({
  request: {
    headers: {
      Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
    },
  },
});
