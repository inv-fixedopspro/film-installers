import type { FieldConfig } from "./types";

export const loginFields: FieldConfig[] = [
  {
    name: "email",
    label: "Email",
    type: "email",
    placeholder: "you@example.com",
    required: true,
    gridColumn: "full",
  },
  {
    name: "password",
    label: "Password",
    type: "password",
    placeholder: "Enter your password",
    required: true,
    gridColumn: "full",
  },
];

export const registerFields: FieldConfig[] = [
  {
    name: "email",
    label: "Email",
    type: "email",
    placeholder: "you@example.com",
    required: true,
    gridColumn: "full",
  },
  {
    name: "password",
    label: "Password",
    type: "password",
    placeholder: "Create a password",
    required: true,
    helpText: "Must be at least 8 characters",
    gridColumn: "full",
  },
  {
    name: "confirmPassword",
    label: "Confirm Password",
    type: "password",
    placeholder: "Confirm your password",
    required: true,
    gridColumn: "full",
  },
];

export const forgotPasswordFields: FieldConfig[] = [
  {
    name: "email",
    label: "Email",
    type: "email",
    placeholder: "you@example.com",
    required: true,
    gridColumn: "full",
    helpText: "Enter the email associated with your account",
  },
];

export const resetPasswordFields: FieldConfig[] = [
  {
    name: "password",
    label: "New Password",
    type: "password",
    placeholder: "Enter new password",
    required: true,
    helpText: "Must be at least 8 characters",
    gridColumn: "full",
  },
  {
    name: "confirmPassword",
    label: "Confirm Password",
    type: "password",
    placeholder: "Confirm new password",
    required: true,
    gridColumn: "full",
  },
];
