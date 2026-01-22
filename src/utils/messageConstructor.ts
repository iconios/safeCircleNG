import { OTP_EXPIRES_MINUTES } from "../config/auth";
import { messageType } from "../types/messageLogs.types";

const messageConstructor = (
  messageType: messageType,
  circleMemberName?: string,
  destinationName?: string,
  webLink?: string,
  userName?: string,
  otp?: string,
) => {
  switch (messageType) {
    case "journey_start":
      return `Hi ${circleMemberName}, ${userName ?? "SafeCircle user"}  has started their journey to ${destinationName}. You can track their safe progress here: ${webLink}`;
    case "journey_end":
      return `Hi ${circleMemberName}, ${userName ?? "SafeCircle user"}  has ended their journey at ${destinationName}. View details: ${webLink}`;
    case "circle_invite":
      return `Hi ${circleMemberName}, ${userName ?? "SafeCircle user"} has invited you to join their safety circle on SafeCircle. Accept invitation: ${webLink}`;
    case "emergency":
      return `Hi ${circleMemberName}, ${userName ?? "SafeCircle user"} has triggered an EMERGENCY alert. Please check their status immediately. Web access: ${webLink}`;
    case "missed_checkin":
      return `Hi ${circleMemberName}, ${userName ?? "SafeCircle user"} has missed a scheduled check-in. Please try to make contact. Web access: ${webLink}`;
    case "extension_granted":
      return `Hi ${userName ?? "SafeCircle user"}, your journey timer has been extended by 30 minutes as requested by your Circle. Update status: ${webLink}`;
    case "verification":
      return `Hi, your safeCircle verification code is ${otp}. Expires in ${OTP_EXPIRES_MINUTES} minutes.`;
    default:
      return `Hi, a safeCircle user attempts to notify you of an event`;
  }
};

export default messageConstructor;
