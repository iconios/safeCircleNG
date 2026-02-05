export const getKeyName = (...args: string[]) => {
  return `safe_cirle: ${args.join(":")}`;
};

export const plainOtpKeyByPhone = (phone: string) =>
  getKeyName("plain_otp", phone);
export const hashOtpKeyByPhone = (phone: string) =>
  getKeyName("hash_otp", phone);
