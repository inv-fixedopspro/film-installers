export const ERROR_CODES = {
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  EMAIL_NOT_VERIFIED: "EMAIL_NOT_VERIFIED",
  EMAIL_ALREADY_EXISTS: "EMAIL_ALREADY_EXISTS",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  TOKEN_INVALID: "TOKEN_INVALID",
  TOKEN_ALREADY_USED: "TOKEN_ALREADY_USED",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  SERVER_ERROR: "SERVER_ERROR",
  PROFILE_EXISTS: "PROFILE_EXISTS",
  PROFILE_NOT_FOUND: "PROFILE_NOT_FOUND",
  NETWORK_ERROR: "NETWORK_ERROR",
  SESSION_EXPIRED: "SESSION_EXPIRED",
  FLAG_DUPLICATE: "FLAG_DUPLICATE",
  FLAG_SELF: "FLAG_SELF",
  FLAG_LIMIT_REACHED: "FLAG_LIMIT_REACHED",
  USER_BANNED: "USER_BANNED",
  USER_RESTRICTED: "USER_RESTRICTED",
  ALREADY_A_MEMBER: "ALREADY_A_MEMBER",
  ALREADY_ON_TEAM: "ALREADY_ON_TEAM",
  INVITATION_NOT_FOUND: "INVITATION_NOT_FOUND",
  INVITATION_EXPIRED: "INVITATION_EXPIRED",
  INVITATION_INVALID: "INVITATION_INVALID",
  OWNER_CANNOT_LEAVE: "OWNER_CANNOT_LEAVE",
  NOT_A_MEMBER: "NOT_A_MEMBER",
  SELF_REMOVE_FORBIDDEN: "SELF_REMOVE_FORBIDDEN",
  LOCATION_NOT_FOUND: "LOCATION_NOT_FOUND",
} as const;

export type ErrorCode = keyof typeof ERROR_CODES;

export enum ErrorType {
  VALIDATION = "validation",
  AUTH = "auth",
  SERVER = "server",
  NETWORK = "network",
}

const ERROR_MESSAGES: Record<string, { message: string; type: ErrorType; recoverable: boolean }> = {
  [ERROR_CODES.INVALID_CREDENTIALS]: {
    message: "Invalid email or password",
    type: ErrorType.AUTH,
    recoverable: true,
  },
  [ERROR_CODES.EMAIL_NOT_VERIFIED]: {
    message: "Please verify your email before logging in",
    type: ErrorType.AUTH,
    recoverable: true,
  },
  [ERROR_CODES.EMAIL_ALREADY_EXISTS]: {
    message: "An account with this email already exists",
    type: ErrorType.VALIDATION,
    recoverable: true,
  },
  [ERROR_CODES.TOKEN_EXPIRED]: {
    message: "This link has expired. Please request a new one.",
    type: ErrorType.AUTH,
    recoverable: true,
  },
  [ERROR_CODES.TOKEN_INVALID]: {
    message: "Invalid or expired link",
    type: ErrorType.AUTH,
    recoverable: true,
  },
  [ERROR_CODES.TOKEN_ALREADY_USED]: {
    message: "This link has already been used",
    type: ErrorType.AUTH,
    recoverable: false,
  },
  [ERROR_CODES.UNAUTHORIZED]: {
    message: "Please log in to continue",
    type: ErrorType.AUTH,
    recoverable: true,
  },
  [ERROR_CODES.FORBIDDEN]: {
    message: "You don't have permission to perform this action",
    type: ErrorType.AUTH,
    recoverable: false,
  },
  [ERROR_CODES.NOT_FOUND]: {
    message: "The requested resource was not found",
    type: ErrorType.SERVER,
    recoverable: false,
  },
  [ERROR_CODES.VALIDATION_ERROR]: {
    message: "Please check your input and try again",
    type: ErrorType.VALIDATION,
    recoverable: true,
  },
  [ERROR_CODES.SERVER_ERROR]: {
    message: "Something went wrong. Please try again.",
    type: ErrorType.SERVER,
    recoverable: true,
  },
  [ERROR_CODES.PROFILE_EXISTS]: {
    message: "A profile of this type already exists",
    type: ErrorType.VALIDATION,
    recoverable: false,
  },
  [ERROR_CODES.PROFILE_NOT_FOUND]: {
    message: "Profile not found",
    type: ErrorType.SERVER,
    recoverable: false,
  },
  [ERROR_CODES.NETWORK_ERROR]: {
    message: "Connection failed. Please check your internet and try again.",
    type: ErrorType.NETWORK,
    recoverable: true,
  },
  [ERROR_CODES.SESSION_EXPIRED]: {
    message: "Your session has expired. Please log in again.",
    type: ErrorType.AUTH,
    recoverable: true,
  },
  [ERROR_CODES.FLAG_DUPLICATE]: {
    message: "You have already reported this content",
    type: ErrorType.VALIDATION,
    recoverable: false,
  },
  [ERROR_CODES.FLAG_SELF]: {
    message: "You cannot report your own content",
    type: ErrorType.VALIDATION,
    recoverable: false,
  },
  [ERROR_CODES.FLAG_LIMIT_REACHED]: {
    message: "You have reached the reporting limit for this content",
    type: ErrorType.VALIDATION,
    recoverable: false,
  },
  [ERROR_CODES.USER_BANNED]: {
    message: "This account has been permanently banned",
    type: ErrorType.AUTH,
    recoverable: false,
  },
  [ERROR_CODES.USER_RESTRICTED]: {
    message: "This account has been restricted",
    type: ErrorType.AUTH,
    recoverable: true,
  },
  [ERROR_CODES.ALREADY_A_MEMBER]: {
    message: "This person is already a member of your team or has a pending invitation",
    type: ErrorType.VALIDATION,
    recoverable: false,
  },
  [ERROR_CODES.ALREADY_ON_TEAM]: {
    message: "You are already a member of this team",
    type: ErrorType.VALIDATION,
    recoverable: false,
  },
  [ERROR_CODES.INVITATION_NOT_FOUND]: {
    message: "Invitation not found. The link may be invalid.",
    type: ErrorType.AUTH,
    recoverable: false,
  },
  [ERROR_CODES.INVITATION_EXPIRED]: {
    message: "This invitation has expired. Please ask the company owner to send a new one.",
    type: ErrorType.AUTH,
    recoverable: false,
  },
  [ERROR_CODES.INVITATION_INVALID]: {
    message: "This invitation is no longer valid",
    type: ErrorType.AUTH,
    recoverable: false,
  },
  [ERROR_CODES.OWNER_CANNOT_LEAVE]: {
    message: "The company owner cannot leave their own team",
    type: ErrorType.VALIDATION,
    recoverable: false,
  },
  [ERROR_CODES.NOT_A_MEMBER]: {
    message: "This user is not a member of the team",
    type: ErrorType.VALIDATION,
    recoverable: false,
  },
  [ERROR_CODES.SELF_REMOVE_FORBIDDEN]: {
    message: "You cannot remove yourself using this action",
    type: ErrorType.VALIDATION,
    recoverable: false,
  },
  [ERROR_CODES.LOCATION_NOT_FOUND]: {
    message: "Location not found",
    type: ErrorType.SERVER,
    recoverable: false,
  },
};

const RPC_ERROR_CODES = [
  "INVALID_TOKEN",
  "TOKEN_ALREADY_USED",
  "TOKEN_EXPIRED",
  "PROFILE_EXISTS",
  "PROFILE_NOT_FOUND",
  "FLAG_DUPLICATE",
  "FLAG_SELF",
  "FLAG_LIMIT_REACHED",
  "USER_BANNED",
  "USER_RESTRICTED",
  "ALREADY_A_MEMBER",
  "ALREADY_ON_TEAM",
  "INVITATION_NOT_FOUND",
  "INVITATION_EXPIRED",
  "INVITATION_INVALID",
  "OWNER_CANNOT_LEAVE",
  "NOT_A_MEMBER",
  "SELF_REMOVE_FORBIDDEN",
  "LOCATION_NOT_FOUND",
] as const;

export function extractRpcErrorCode(message: string): string | null {
  for (const code of RPC_ERROR_CODES) {
    if (message.includes(code)) {
      return code;
    }
  }
  return null;
}

export function getUserFriendlyError(
  code: string | null | undefined,
  fallbackMessage?: string
): string {
  if (!code) {
    return fallbackMessage || ERROR_MESSAGES[ERROR_CODES.SERVER_ERROR].message;
  }

  const mappedCode = mapRpcToErrorCode(code);
  const errorInfo = ERROR_MESSAGES[mappedCode];

  if (errorInfo) {
    return errorInfo.message;
  }

  return fallbackMessage || ERROR_MESSAGES[ERROR_CODES.SERVER_ERROR].message;
}

function mapRpcToErrorCode(rpcCode: string): string {
  const mapping: Record<string, string> = {
    INVALID_TOKEN: ERROR_CODES.TOKEN_INVALID,
    TOKEN_ALREADY_USED: ERROR_CODES.TOKEN_ALREADY_USED,
    TOKEN_EXPIRED: ERROR_CODES.TOKEN_EXPIRED,
    PROFILE_EXISTS: ERROR_CODES.PROFILE_EXISTS,
    PROFILE_NOT_FOUND: ERROR_CODES.PROFILE_NOT_FOUND,
    FLAG_DUPLICATE: ERROR_CODES.FLAG_DUPLICATE,
    FLAG_SELF: ERROR_CODES.FLAG_SELF,
    FLAG_LIMIT_REACHED: ERROR_CODES.FLAG_LIMIT_REACHED,
    USER_BANNED: ERROR_CODES.USER_BANNED,
    USER_RESTRICTED: ERROR_CODES.USER_RESTRICTED,
    ALREADY_A_MEMBER: ERROR_CODES.ALREADY_A_MEMBER,
    ALREADY_ON_TEAM: ERROR_CODES.ALREADY_ON_TEAM,
    INVITATION_NOT_FOUND: ERROR_CODES.INVITATION_NOT_FOUND,
    INVITATION_EXPIRED: ERROR_CODES.INVITATION_EXPIRED,
    INVITATION_INVALID: ERROR_CODES.INVITATION_INVALID,
    OWNER_CANNOT_LEAVE: ERROR_CODES.OWNER_CANNOT_LEAVE,
    NOT_A_MEMBER: ERROR_CODES.NOT_A_MEMBER,
    SELF_REMOVE_FORBIDDEN: ERROR_CODES.SELF_REMOVE_FORBIDDEN,
    LOCATION_NOT_FOUND: ERROR_CODES.LOCATION_NOT_FOUND,
  };

  return mapping[rpcCode] || rpcCode;
}

export function getErrorType(code: string | null | undefined): ErrorType {
  if (!code) return ErrorType.SERVER;

  const mappedCode = mapRpcToErrorCode(code);
  const errorInfo = ERROR_MESSAGES[mappedCode];

  return errorInfo?.type || ErrorType.SERVER;
}

export function isRecoverableError(code: string | null | undefined): boolean {
  if (!code) return true;

  const mappedCode = mapRpcToErrorCode(code);
  const errorInfo = ERROR_MESSAGES[mappedCode];

  return errorInfo?.recoverable ?? true;
}

export function getRecoverySuggestion(code: string | null | undefined): string | null {
  const errorType = getErrorType(code);

  switch (errorType) {
    case ErrorType.NETWORK:
      return "Check your internet connection and try again.";
    case ErrorType.AUTH:
      if (code === ERROR_CODES.SESSION_EXPIRED || code === ERROR_CODES.UNAUTHORIZED) {
        return "Please log in again to continue.";
      }
      if (code === ERROR_CODES.EMAIL_NOT_VERIFIED) {
        return "Check your inbox for the verification email.";
      }
      if (code === ERROR_CODES.TOKEN_EXPIRED) {
        return "Request a new link to continue.";
      }
      return null;
    case ErrorType.SERVER:
      return "If this problem persists, please contact support.";
    default:
      return null;
  }
}
