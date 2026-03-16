import { InstallerProfileForm } from "@/components/forms";

export default function CreateInstallerProfilePage() {
  return (
    <InstallerProfileForm
      variant="dashboard"
      backHref="/dashboard"
      backLabel="Back to Dashboard"
      successRedirect="/dashboard/installer"
    />
  );
}
