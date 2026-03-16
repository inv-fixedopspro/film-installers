import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export interface CookieToSet {
  name: string;
  value: string;
  options: CookieOptions;
}

export interface RouteHandlerClientResult {
  supabase: ReturnType<typeof createServerClient>;
  cookies: CookieToSet[];
}

type CookieStore = Awaited<ReturnType<typeof cookies>>;

export function createRouteHandlerClientWithCookies(
  cookieStore: CookieStore
): RouteHandlerClientResult {
  const cookiesToSet: CookieToSet[] = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(newCookies) {
          newCookies.forEach(({ name, value, options }) => {
            cookiesToSet.push({ name, value, options });
          });
        },
      },
    }
  );

  return { supabase, cookies: cookiesToSet };
}

export async function createRouteHandlerClient(): Promise<RouteHandlerClientResult> {
  const cookieStore = await cookies();
  return createRouteHandlerClientWithCookies(cookieStore);
}

export function applyAuthCookies<T>(
  response: NextResponse<T>,
  cookiesToSet: CookieToSet[]
): NextResponse<T> {
  cookiesToSet.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });
  return response;
}
