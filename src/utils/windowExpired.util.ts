const ONE_HOUR_MS = 60 * 60 * 1000;
const ONE_DAY_MS = 24 * ONE_HOUR_MS;

const isHourWindowExpired = (
  windowStartedAt: string | null,
  now: Date,
): boolean => {
  if (!windowStartedAt) return true;
  return now.getTime() - new Date(windowStartedAt).getTime() >= ONE_HOUR_MS;
};

const isDayWindowExpired = (
  windowStartedAt: string | null,
  now: Date,
): boolean => {
  if (!windowStartedAt) return true;
  return now.getTime() - new Date(windowStartedAt).getTime() >= ONE_DAY_MS;
};

export { isHourWindowExpired, isDayWindowExpired };
