import { SupabaseClient } from "@supabase/supabase-js";
import { extractRpcErrorCode } from "@/lib/errors";

export interface RpcResult<T> {
  data: T | null;
  error: string | null;
  errorCode: string | null;
}

export interface QueryResult<T> {
  data: T | null;
  error: string | null;
}

export async function callRpc<T>(
  supabase: SupabaseClient,
  functionName: string,
  params: Record<string, unknown>
): Promise<RpcResult<T>> {
  const { data, error } = await supabase.rpc(functionName, params);

  if (error) {
    const errorCode = extractRpcErrorCode(error.message);
    return { data: null, error: error.message, errorCode };
  }

  return { data: data as T, error: null, errorCode: null };
}

export async function queryOne<T>(
  supabase: SupabaseClient,
  table: string,
  column: string,
  value: string,
  selectColumns: string = "*"
): Promise<QueryResult<T>> {
  const { data, error } = await supabase
    .from(table)
    .select(selectColumns)
    .eq(column, value)
    .maybeSingle();

  return { data: data as T | null, error: error?.message || null };
}

export async function getFlagCountLast24h(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { count } = await supabase
    .from("content_flags")
    .select("id", { count: "exact", head: true })
    .eq("flagger_user_id", userId)
    .gte("created_at", since);

  return count ?? 0;
}

export async function getDailyFlagLimit(
  supabase: SupabaseClient,
  defaultLimit = 10
): Promise<number> {
  const { data } = await supabase
    .from("moderation_config")
    .select("value")
    .eq("key", "daily_flag_limit")
    .maybeSingle();

  if (data?.value) {
    const parsed = parseInt(data.value, 10);
    if (!isNaN(parsed)) return parsed;
  }

  return defaultLimit;
}

export async function checkExists(
  supabase: SupabaseClient,
  table: string,
  column: string,
  value: string
): Promise<boolean> {
  const { data } = await supabase
    .from(table)
    .select("id")
    .eq(column, value)
    .maybeSingle();

  return data !== null;
}
