import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ZodSchema } from "zod";
import { createRouteHandlerClientWithCookies, applyAuthCookies, type CookieToSet } from "@/lib/supabase/route-handler";
import { createAdminClient } from "@/lib/supabase/admin";
import { validateRequestBody, isValidationError } from "./validation-helpers";
import { errorResponse, validationErrorResponse, ERROR_CODES, type ApiResponse } from "./response";
import type { SupabaseClient } from "@supabase/supabase-js";

interface RouteContext<T = unknown> {
  request: NextRequest;
  data: T;
  supabase: SupabaseClient;
  userId?: string;
}

interface RouteOptions<T> {
  schema?: ZodSchema<T>;
  requireAuth?: boolean;
  useAdmin?: boolean;
  requireAdminRole?: boolean;
}

type RouteHandler<T, R> = (ctx: RouteContext<T>) => Promise<NextResponse<ApiResponse<R>>>;

export function createRoute<T = unknown, R = unknown>(
  handler: RouteHandler<T, R>,
  options: RouteOptions<T> = {}
) {
  const { schema, requireAuth = false, useAdmin = false, requireAdminRole = false } = options;

  return async (request: NextRequest): Promise<NextResponse<ApiResponse<R>>> => {
    let collectedCookies: CookieToSet[] = [];
    const cookieStore = await cookies();

    try {
      let data: T = {} as T;

      if (schema) {
        const validation = await validateRequestBody(request, schema);
        if (isValidationError(validation)) {
          return validationErrorResponse(validation.error, validation.errors) as NextResponse<ApiResponse<R>>;
        }
        data = validation.data;
      }

      let supabase: SupabaseClient;
      const { supabase: anonClient, cookies: setCookies } = createRouteHandlerClientWithCookies(cookieStore);

      if (useAdmin || requireAdminRole) {
        supabase = createAdminClient();
        collectedCookies = setCookies;
      } else {
        supabase = anonClient;
        collectedCookies = setCookies;
      }

      let userId: string | undefined;

      if (requireAuth) {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) {
          return errorResponse("Unauthorized", 401, ERROR_CODES.UNAUTHORIZED) as NextResponse<ApiResponse<R>>;
        }
        userId = user.id;
      }

      if (requireAdminRole) {
        const { data: { user }, error: authError } = await anonClient.auth.getUser();
        if (authError || !user) {
          return errorResponse("Unauthorized", 401, ERROR_CODES.UNAUTHORIZED) as NextResponse<ApiResponse<R>>;
        }
        const { data: profile, error: profileError } = await anonClient
          .from("profiles")
          .select("id, role")
          .eq("id", user.id)
          .maybeSingle();
        if (profileError || !profile || profile.role !== "admin") {
          return errorResponse("Forbidden", 403, ERROR_CODES.FORBIDDEN) as NextResponse<ApiResponse<R>>;
        }
        userId = user.id;
      }

      const response = await handler({ request, data, supabase, userId });

      if (collectedCookies.length > 0) {
        return applyAuthCookies(response, collectedCookies);
      }

      return response;
    } catch (error) {
      console.error("Route error:", error);
      return errorResponse("An unexpected error occurred", 500, ERROR_CODES.SERVER_ERROR) as NextResponse<ApiResponse<R>>;
    }
  };
}

export function createAuthRoute<T = unknown, R = unknown>(
  handler: RouteHandler<T, R>,
  schema?: ZodSchema<T>
) {
  return createRoute(handler, { schema, requireAuth: true });
}

export function createAdminRoute<T = unknown, R = unknown>(
  handler: RouteHandler<T, R>,
  schema?: ZodSchema<T>
) {
  return createRoute(handler, { schema, requireAdminRole: true });
}
