import { z } from "zod";

export const emailSchema = z
  .string()
  .min(1, "Email is required")
  .email("Please enter a valid email address");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

const confirmPasswordSchema = z.string().min(1, "Please confirm your password");

const passwordWithConfirmation = {
  password: passwordSchema,
  confirmPassword: confirmPasswordSchema,
};

function passwordsMatch(data: { password: string; confirmPassword: string }) {
  return data.password === data.confirmPassword;
}

const passwordMismatchError = {
  message: "Passwords do not match",
  path: ["confirmPassword"],
};

export const registerSchema = z
  .object({
    email: emailSchema,
    ...passwordWithConfirmation,
    ageConfirmed: z.boolean().refine((val) => val === true, {
      message: "You must confirm you are 18 years of age or older",
    }),
    termsAccepted: z.boolean().refine((val) => val === true, {
      message: "You must agree to the Terms of Service and Privacy Policy",
    }),
  })
  .refine(passwordsMatch, passwordMismatchError);

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object(passwordWithConfirmation)
  .refine(passwordsMatch, passwordMismatchError);

export const resetPasswordWithTokenSchema = z
  .object({
    token: z.string().min(1, "Reset token is required"),
    ...passwordWithConfirmation,
  })
  .refine(passwordsMatch, passwordMismatchError);

export type RegisterFormData = z.infer<typeof registerSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type ResetPasswordWithTokenFormData = z.infer<typeof resetPasswordWithTokenSchema>;
