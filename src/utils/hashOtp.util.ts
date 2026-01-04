import bcrypt from "bcryptjs";

const HashOtp = async (otp: string) => {
  const saltRounds = 10;
  return await bcrypt.hash(otp, saltRounds);
};

export default HashOtp;
