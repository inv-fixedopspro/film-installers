"use client";

import { EmployerProfileForm } from "@/components/forms";

export default function EmployerOnboardingPage() {
  return (
    <EmployerProfileForm
      variant="onboarding"
      backHref="/onboarding/select-type"
      successRedirect="/dashboard"
    />
  );
}
