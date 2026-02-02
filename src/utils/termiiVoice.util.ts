// providers/termiiVoice.js
import axios from "axios";

export async function sendVoiceOtp(phone: string, otp: string) {
  const res = await axios.post(
    `${process.env.TERMII_BASE_URL}/api/sms/otp/call`,
    {
      phone_number: phone,
      otp,
      api_key: process.env.TERMII_API_KEY,
    },
    { timeout: 8000 }
  );

  return res.data?.status === "success";
}


