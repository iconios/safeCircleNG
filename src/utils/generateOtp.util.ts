import { otpGen } from "otp-gen-agent";

const generateOtpUtil = async () => {
  try {
    return await otpGen({ length: 6, type: "numeric" });
  } catch {}
};

export default generateOtpUtil;
