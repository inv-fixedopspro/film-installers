"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertMessage,
  FormField,
  FormSection,
  LoadingButton,
  ConfirmationDialog,
  SectionHeader,
  StateSelector,
  PhoneInput,
} from "@/components/shared";
import { toast } from "@/hooks/use-toast";
import { useApiMutation } from "@/hooks";
import { getStateName, formatPhoneDisplay } from "@/lib/formatters";
import { companyLocationSchema, type CompanyLocationData } from "@/lib/validations/company";
import { MapPinned, Plus, MapPin, Phone, Loader as Loader2, X, Pencil } from "lucide-react";
import type { CompanyLocationResult } from "@/lib/db/types";

interface LocationsSectionProps {
  employerProfileId: string;
}

export function LocationsSection({ employerProfileId }: LocationsSectionProps) {
  const [locations, setLocations] = useState<CompanyLocationResult[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState<CompanyLocationResult | null>(null);

  const form = useForm<CompanyLocationData>({
    resolver: zodResolver(companyLocationSchema.omit({ employer_profile_id: true }) as typeof companyLocationSchema),
    defaultValues: {
      employer_profile_id: employerProfileId,
      name: "",
      address_line1: "",
      address_line2: "",
      city: "",
      state: "",
      zip_code: "",
      phone: "",
    },
  });

  const { register, handleSubmit, control, reset, formState: { errors } } = form;

  const addMutation = useApiMutation<CompanyLocationData, unknown>("/api/company/locations", "POST");
  const deactivateMutation = useApiMutation<{ location_id: string }, unknown>("/api/company/locations/deactivate", "POST");

  const fetchLocations = useCallback(async () => {
    setIsLoadingData(true);
    setFetchError(null);
    try {
      const res = await fetch(`/api/company/locations?employer_profile_id=${employerProfileId}`);
      const result = await res.json();
      if (!res.ok) {
        setFetchError(result.error || "Failed to load locations");
        return;
      }
      setLocations(result.data?.locations ?? []);
    } catch {
      setFetchError("Failed to load locations");
    } finally {
      setIsLoadingData(false);
    }
  }, [employerProfileId]);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  const handleAddSubmit = async (data: CompanyLocationData) => {
    try {
      await addMutation.mutateAsync({ ...data, employer_profile_id: employerProfileId });
      toast({ title: "Location added" });
      reset({ employer_profile_id: employerProfileId, name: "", address_line1: "", address_line2: "", city: "", state: "", zip_code: "", phone: "" });
      setAddOpen(false);
      await fetchLocations();
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to add location", variant: "destructive" });
    }
  };

  const handleDeactivate = async () => {
    if (!deactivateTarget) return;
    try {
      await deactivateMutation.mutateAsync({ location_id: deactivateTarget.id });
      toast({ title: "Location removed" });
      setDeactivateTarget(null);
      await fetchLocations();
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to remove location", variant: "destructive" });
      setDeactivateTarget(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPinned className="h-4 w-4" />
                Locations
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Optional — add physical locations for your business</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => { reset({ employer_profile_id: employerProfileId, name: "", address_line1: "", address_line2: "", city: "", state: "", zip_code: "", phone: "" }); setAddOpen(true); }}
            >
              <Plus className="h-3.5 w-3.5" />
              Add Location
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingData ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : fetchError ? (
            <AlertMessage variant="error" message={fetchError} />
          ) : locations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
              <MapPinned className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No locations added yet</p>
              <p className="text-xs text-muted-foreground/70">Add locations to help job seekers find your shops</p>
            </div>
          ) : (
            <div className="divide-y divide-border rounded-lg border">
              {locations.map((loc) => (
                <div key={loc.id} className="flex items-start justify-between px-4 py-3 gap-3">
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">{loc.name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      {loc.address_line1}{loc.address_line2 ? `, ${loc.address_line2}` : ""}, {loc.city}, {getStateName(loc.state)}{loc.zip_code ? ` ${loc.zip_code}` : ""}
                    </p>
                    {loc.phone && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3 flex-shrink-0" />
                        {formatPhoneDisplay(loc.phone)}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <Badge variant="outline" className="text-xs">{loc.is_active ? "Active" : "Inactive"}</Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => setDeactivateTarget(loc)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={addOpen} onOpenChange={(open) => { if (!addMutation.isLoading) setAddOpen(open); }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Location</DialogTitle>
            <DialogDescription>Add a physical location for your business.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(handleAddSubmit)} className="space-y-4 py-2">
            <FormSection title="Location Details">
              <FormField label="Location Name" htmlFor="loc-name" error={errors.name?.message} required>
                <Input id="loc-name" placeholder="Downtown Shop" {...register("name")} />
              </FormField>
              <FormField label="Street Address" htmlFor="loc-addr1" error={errors.address_line1?.message} required>
                <Input id="loc-addr1" placeholder="123 Main St" {...register("address_line1")} />
              </FormField>
              <FormField label="Suite / Unit" htmlFor="loc-addr2" error={errors.address_line2?.message}>
                <Input id="loc-addr2" placeholder="Suite 100 (optional)" {...register("address_line2")} />
              </FormField>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="City" htmlFor="loc-city" error={errors.city?.message} required>
                  <Input id="loc-city" placeholder="Los Angeles" {...register("city")} />
                </FormField>
                <FormField label="State" htmlFor="loc-state" error={errors.state?.message} required>
                  <Controller name="state" control={control} render={({ field }) => (
                    <StateSelector value={field.value || ""} onValueChange={field.onChange} />
                  )} />
                </FormField>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="ZIP Code" htmlFor="loc-zip" error={errors.zip_code?.message}>
                  <Input id="loc-zip" placeholder="90001" {...register("zip_code")} />
                </FormField>
                <FormField label="Phone" htmlFor="loc-phone" error={errors.phone?.message}>
                  <Controller name="phone" control={control} render={({ field }) => (
                    <PhoneInput value={field.value || ""} onChange={field.onChange} />
                  )} />
                </FormField>
              </div>
            </FormSection>
            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)} disabled={addMutation.isLoading}>
                Cancel
              </Button>
              <LoadingButton type="submit" loading={addMutation.isLoading} loadingText="Adding...">
                Add Location
              </LoadingButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={!!deactivateTarget}
        onOpenChange={(open) => { if (!open) setDeactivateTarget(null); }}
        onConfirm={handleDeactivate}
        title="Remove Location"
        description={`Remove "${deactivateTarget?.name}"? This location will no longer appear on your profile.`}
        confirmText="Remove Location"
        variant="destructive"
        loading={deactivateMutation.isLoading}
      />
    </>
  );
}
