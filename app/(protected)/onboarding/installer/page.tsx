import { InstallerProfileForm } from "@/components/forms";

export default function InstallerOnboardingPage() {
  return (
    <InstallerProfileForm
      variant="onboarding"
      backHref="/onboarding/select-type"
      successRedirect="/dashboard"
    />
  );
}
