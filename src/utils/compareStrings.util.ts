import bcrypt from "bcryptjs";

const CompareStrings = async (
  plainString: string,
  hashedString: string,
): Promise<boolean> => {
  return await bcrypt.compare(plainString, hashedString);
};

export default CompareStrings;
