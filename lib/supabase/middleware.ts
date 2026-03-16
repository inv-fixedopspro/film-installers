import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { AccountStatus, ContentVisibility } from "@/lib/types/database";

export interface SessionResult {
  response: NextResponse;
  user: { id: string; email?: string } | null;
  accountStatus: AccountStatus | null;
  contentVisibility: ContentVisibility | null;
}

export async function updateSession(request: NextRequest): Promise<SessionResult> {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { response: supabaseResponse, user: null, accountStatus: null, contentVisibility: null };
  }

  const cachedStatus = request.cookies.get("x-account-status")?.value as AccountStatus | undefined;
  const cachedVisibility = request.cookies.get("x-content-visibility")?.value as ContentVisibility | undefined;

  if (cachedStatus && cachedVisibility) {
    return {
      response: supabaseResponse,
      user,
      accountStatus: cachedStatus,
      contentVisibility: cachedVisibility,
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("account_status, content_visibility")
    .eq("id", user.id)
    .maybeSingle();

  const accountStatus: AccountStatus = (profile?.account_status as AccountStatus) ?? "active";
  const contentVisibility: ContentVisibility = (profile?.content_visibility as ContentVisibility) ?? "visible";

  supabaseResponse.cookies.set("x-account-status", accountStatus, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 5,
  });
  supabaseResponse.cookies.set("x-content-visibility", contentVisibility, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 5,
  });

  return { response: supabaseResponse, user, accountStatus, contentVisibility };
}
