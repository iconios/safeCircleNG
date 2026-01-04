// 3 months free subscription
const subscriptionExpiresAt = (): Date => {
  const date = new Date();
  date.setDate(date.getDate() + 90);
  return date;
};

// 15 minutes otp code expiration
const verificationCodeExpiresAt = (): Date => {
  const date = new Date();
  date.setMinutes(date.getMinutes() + 15);
  return date;
};

export { subscriptionExpiresAt, verificationCodeExpiresAt };
