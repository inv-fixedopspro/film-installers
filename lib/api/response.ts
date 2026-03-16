import { NextResponse } from "next/server";
import {
  ERROR_CODES,
  getUserFriendlyError,
  type ErrorCode,
} from "@/lib/errors";

export type { ErrorCode };
export { ERROR_CODES };

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  errors?: Record<string, string>;
}

export function successResponse<T>(data: T, status = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ success: true, data }, { status });
}

export function errorResponse(
  message: string,
  status = 400,
  code?: string
): NextResponse<ApiResponse<never>> {
  return NextResponse.json({ success: false, error: message, code }, { status });
}

export function validationErrorResponse(
  message: string,
  errors: Record<string, string>
): NextResponse<ApiResponse<never>> {
  return NextResponse.json(
    { success: false, error: message, code: ERROR_CODES.VALIDATION_ERROR, errors },
    { status: 400 }
  );
}

export function rpcErrorResponse(
  errorCode: string | null,
  fallbackMessage: string = "An error occurred"
): NextResponse<ApiResponse<never>> {
  const statusMap: Record<string, number> = {
    INVALID_TOKEN: 400,
    TOKEN_ALREADY_USED: 400,
    TOKEN_EXPIRED: 400,
    PROFILE_EXISTS: 400,
    PROFILE_NOT_FOUND: 404,
    FLAG_SELF: 422,
    FLAG_DUPLICATE: 409,
    FLAG_LIMIT_REACHED: 429,
    USER_BANNED: 403,
    USER_RESTRICTED: 403,
    ALREADY_A_MEMBER: 409,
    ALREADY_ON_TEAM: 409,
    INVITATION_NOT_FOUND: 404,
    INVITATION_EXPIRED: 410,
    INVITATION_INVALID: 400,
    OWNER_CANNOT_LEAVE: 422,
    NOT_A_MEMBER: 404,
    SELF_REMOVE_FORBIDDEN: 422,
    LOCATION_NOT_FOUND: 404,
    FORBIDDEN: 403,
  };

  const codeMap: Record<string, string> = {
    INVALID_TOKEN: ERROR_CODES.TOKEN_INVALID,
    TOKEN_ALREADY_USED: ERROR_CODES.TOKEN_ALREADY_USED,
    TOKEN_EXPIRED: ERROR_CODES.TOKEN_EXPIRED,
    PROFILE_EXISTS: ERROR_CODES.PROFILE_EXISTS,
    PROFILE_NOT_FOUND: ERROR_CODES.PROFILE_NOT_FOUND,
    FLAG_SELF: ERROR_CODES.FLAG_SELF,
    FLAG_DUPLICATE: ERROR_CODES.FLAG_DUPLICATE,
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
    FORBIDDEN: ERROR_CODES.FORBIDDEN,
  };

  if (errorCode && codeMap[errorCode]) {
    const message = getUserFriendlyError(errorCode, fallbackMessage);
    const status = statusMap[errorCode] || 400;
    const code = codeMap[errorCode];
    return errorResponse(message, status, code);
  }

  return errorResponse(fallbackMessage, 500, ERROR_CODES.SERVER_ERROR);
}

export function authErrorResponse(code: string): NextResponse<ApiResponse<never>> {
  const statusMap: Record<string, number> = {
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    EMAIL_NOT_VERIFIED: 403,
    PROFILE_NOT_FOUND: 404,
  };

  const message = getUserFriendlyError(code, "Authentication error");
  return errorResponse(message, statusMap[code] || 401, code);
}
