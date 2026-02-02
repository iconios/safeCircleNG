// providers/sendchampWhatsapp.js
import axios from "axios";

export async function sendWhatsappSendChamp(phone: string, otp: string) {
  const res = await axios.post(
    `${process.env.SENDCHAMP_BASE_URL}/whatsapp/message/send`,
    {
      to: phone,
      template_code: "otp_template",
      parameters: { code: otp },
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.SENDCHAMP_API_KEY}`,
      },
      timeout: 8000,
    }
  );

  return res.data?.status === "success";
}
