"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { UseFormReturn, FieldValues, Path } from "react-hook-form";
import { toast } from "@/hooks/use-toast";
import type { ApiResponse } from "@/lib/api/response";

interface FormSubmitOptions<TData> {
  method?: "POST" | "PUT" | "DELETE";
  successMessage?: string;
  successRedirect?: string;
  onSuccess?: (data: TData) => void | Promise<void>;
  onError?: (error: string) => void;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
}

interface UseFormSubmitReturn<TFormData extends FieldValues, TResponseData> {
  submitHandler: (data: TFormData) => Promise<void>;
  isSubmitting: boolean;
  submitError: string | null;
  reset: () => void;
}

export function useFormSubmit<TFormData extends FieldValues, TResponseData = unknown>(
  url: string,
  form: UseFormReturn<TFormData>,
  options: FormSubmitOptions<TResponseData> = {}
): UseFormSubmitReturn<TFormData, TResponseData> {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    method = "POST",
    successMessage,
    successRedirect,
    onSuccess,
    onError,
    showSuccessToast = true,
    showErrorToast = true,
  } = options;

  const reset = useCallback(() => {
    setSubmitError(null);
    setIsSubmitting(false);
  }, []);

  const submitHandler = useCallback(
    async (data: TFormData) => {
      setIsSubmitting(true);
      setSubmitError(null);

      try {
        const response = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        const result: ApiResponse<TResponseData> = await response.json();

        if (!result.success) {
          const error = result.error || "An error occurred";
          setSubmitError(error);

          if (result.errors) {
            Object.entries(result.errors).forEach(([field, message]) => {
              if (field !== "_form") {
                form.setError(field as Path<TFormData>, {
                  type: "server",
                  message: message as string,
                });
              }
            });
          }

          if (showErrorToast) {
            toast({
              title: "Error",
              description: error,
              variant: "destructive",
            });
          }

          onError?.(error);
          return;
        }

        if (showSuccessToast && successMessage) {
          toast({
            title: "Success",
            description: successMessage,
          });
        }

        await onSuccess?.(result.data as TResponseData);

        if (successRedirect) {
          router.push(successRedirect);
        }
      } catch (err) {
        const error = "An unexpected error occurred";
        setSubmitError(error);

        if (showErrorToast) {
          toast({
            title: "Error",
            description: error,
            variant: "destructive",
          });
        }

        onError?.(error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [url, method, form, router, successMessage, successRedirect, onSuccess, onError, showSuccessToast, showErrorToast]
  );

  return {
    submitHandler,
    isSubmitting,
    submitError,
    reset,
  };
}
