"use client";

import { useState, useCallback } from "react";
import type { ApiResponse } from "@/lib/api/response";

interface MutationState<TData> {
  data: TData | null;
  error: string | null;
  errors: Record<string, string> | null;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
}

interface MutationOptions<TData> {
  onSuccess?: (data: TData) => void;
  onError?: (error: string, errors?: Record<string, string>) => void;
}

interface UseMutationReturn<TRequest, TData> extends MutationState<TData> {
  mutate: (data: TRequest, options?: MutationOptions<TData>) => void;
  mutateAsync: (data: TRequest) => Promise<TData>;
  reset: () => void;
}

export function useApiMutation<TRequest, TData = unknown>(
  url: string,
  method: "POST" | "PUT" | "DELETE" = "POST",
  defaultOptions?: MutationOptions<TData>
): UseMutationReturn<TRequest, TData> {
  const [state, setState] = useState<MutationState<TData>>({
    data: null,
    error: null,
    errors: null,
    isLoading: false,
    isSuccess: false,
    isError: false,
  });

  const reset = useCallback(() => {
    setState({
      data: null,
      error: null,
      errors: null,
      isLoading: false,
      isSuccess: false,
      isError: false,
    });
  }, []);

  const mutateAsync = useCallback(
    async (requestData: TRequest): Promise<TData> => {
      setState((prev) => ({
        ...prev,
        isLoading: true,
        isSuccess: false,
        isError: false,
        error: null,
        errors: null,
      }));

      try {
        const response = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestData),
        });

        const result: ApiResponse<TData> = await response.json();

        if (!result.success) {
          const error = result.error || "An error occurred";
          const errors = result.errors || null;

          setState({
            data: null,
            error,
            errors,
            isLoading: false,
            isSuccess: false,
            isError: true,
          });

          throw new Error(error);
        }

        setState({
          data: result.data as TData,
          error: null,
          errors: null,
          isLoading: false,
          isSuccess: true,
          isError: false,
        });

        return result.data as TData;
      } catch (err) {
        const error = err instanceof Error ? err.message : "An unexpected error occurred";

        setState((prev) => ({
          ...prev,
          error: prev.error || error,
          isLoading: false,
          isSuccess: false,
          isError: true,
        }));

        throw err;
      }
    },
    [url, method]
  );

  const mutate = useCallback(
    (requestData: TRequest, options?: MutationOptions<TData>) => {
      const mergedOptions = { ...defaultOptions, ...options };

      mutateAsync(requestData)
        .then((data) => {
          mergedOptions.onSuccess?.(data);
        })
        .catch((err) => {
          const error = err instanceof Error ? err.message : "An error occurred";
          mergedOptions.onError?.(error, state.errors || undefined);
        });
    },
    [mutateAsync, defaultOptions, state.errors]
  );

  return {
    ...state,
    mutate,
    mutateAsync,
    reset,
  };
}
