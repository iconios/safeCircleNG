import bcrypt from "bcryptjs";

const HashString = async (plainString: string) => {
  const saltRounds = 10;
  return await bcrypt.hash(plainString, saltRounds);
};

export default HashString;
