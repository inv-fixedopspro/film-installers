"use client";

import { EmployerProfileForm } from "@/components/forms";

export default function CreateEmployerProfilePage() {
  return (
    <EmployerProfileForm
      variant="dashboard"
      backHref="/dashboard"
      backLabel="Back to Dashboard"
      successRedirect="/dashboard/employer"
    />
  );
}
