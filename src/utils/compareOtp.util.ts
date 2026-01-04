import bcrypt from "bcryptjs";

const CompareOtp = async (
  plainOtp: string,
  hashedOtp: string,
): Promise<boolean> => {
  return await bcrypt.compare(plainOtp, hashedOtp);
};

export default CompareOtp;
