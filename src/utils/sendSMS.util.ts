import axios from "axios";
import * as dotenv from "dotenv";
dotenv.config();

const TERMII_API_KEY = process.env.TERMII_API_KEY;
const senderID = process.env.SMS_SENDER_ID;
const TERMII_BASE_URL = process.env.TERMII_BASE_URL;

const SendSMSUtil = async (phoneNumber: string, OTP: string, name?: string) => {
  const url = `${TERMII_BASE_URL}/api/sms/send`;
  const data = {
    to: phoneNumber,
    from: senderID,
    sms: `Hi ${name ?? "new user"}, here's your OTP: ${OTP}`,
    type: "plain",
    channel: "dnd",
    api_key: TERMII_API_KEY,
  };

  try {
    const response = await axios.post(url, data, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    console.log("SMS sent successfully:", response.data);
  } catch (error) {
    console.error("Error sending SMS", error);
  }
};

export default SendSMSUtil;
