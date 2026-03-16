"use client";

import { useFieldArray, Control, UseFormRegister, FieldErrors, UseFormWatch, UseFormSetValue } from "react-hook-form";
import { CirclePlus as PlusCircle, Trash2, Award, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormField } from "@/components/shared";
import type { ResumeFormData } from "@/lib/validations/resume";
import { generateId } from "@/lib/utils/string";

const currentYear = new Date().getFullYear();
const PAST_YEARS = Array.from({ length: currentYear - 1949 }, (_, i) => String(currentYear - i));
const FUTURE_YEARS = Array.from({ length: 21 }, (_, i) => String(currentYear + i));

interface CertificationFieldsProps {
  control: Control<ResumeFormData>;
  register: UseFormRegister<ResumeFormData>;
  errors: FieldErrors<ResumeFormData>;
  watch: UseFormWatch<ResumeFormData>;
  setValue: UseFormSetValue<ResumeFormData>;
}

export function CertificationFields({ control, register, errors, watch, setValue }: CertificationFieldsProps) {
  const { fields, append, remove } = useFieldArray({ control, name: "certifications" });
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const certifications = watch("certifications");

  const addEntry = () => {
    const newIndex = fields.length;
    append({
      id: generateId(),
      name: "",
      issuing_org: "",
      issue_year: String(currentYear),
      expiry_year: null,
      no_expiry: false,
    });
    setExpandedIndex(newIndex);
  };

  return (
    <div className="space-y-3">
      {fields.length === 0 && (
        <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
          <Award className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No certifications added yet</p>
        </div>
      )}

      {fields.map((field, index) => {
        const entry = certifications?.[index];
        const entryErrors = errors.certifications?.[index];
        const isExpanded = expandedIndex === index;
        const label = entry?.name || `Certification ${index + 1}`;

        return (
          <div key={field.id} className="border border-border rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setExpandedIndex(isExpanded ? null : index)}
              className="w-full flex items-center justify-between px-4 py-3 bg-muted/40 hover:bg-muted/70 transition-colors text-left"
            >
              <span className="text-sm font-medium truncate pr-4">{label}</span>
              <div className="flex items-center gap-2 shrink-0">
                {Object.keys(entryErrors || {}).length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-destructive" />
                )}
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </button>

            {isExpanded && (
              <div className="p-4 space-y-4 border-t border-border">
                <FormField
                  label="Certification Name"
                  htmlFor={`cert-name-${index}`}
                  error={entryErrors?.name?.message}
                  required
                >
                  <Input
                    id={`cert-name-${index}`}
                    placeholder="3M Authorized Installer"
                    {...register(`certifications.${index}.name`)}
                  />
                </FormField>

                <FormField
                  label="Issuing Organization"
                  htmlFor={`cert-org-${index}`}
                  error={entryErrors?.issuing_org?.message}
                  required
                >
                  <Input
                    id={`cert-org-${index}`}
                    placeholder="3M"
                    {...register(`certifications.${index}.issuing_org`)}
                  />
                </FormField>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Issue Year <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={entry?.issue_year ?? String(currentYear)}
                      onValueChange={(v) => setValue(`certifications.${index}.issue_year`, v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Year" />
                      </SelectTrigger>
                      <SelectContent>
                        {PAST_YEARS.map((y) => (
                          <SelectItem key={y} value={y}>{y}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {entryErrors?.issue_year && (
                      <p className="text-sm text-destructive">{entryErrors.issue_year.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Expiry Year</Label>
                    <Select
                      value={entry?.expiry_year ?? ""}
                      disabled={entry?.no_expiry}
                      onValueChange={(v) => setValue(`certifications.${index}.expiry_year`, v || null)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Year (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {FUTURE_YEARS.map((y) => (
                          <SelectItem key={y} value={y}>{y}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {entryErrors?.expiry_year && (
                      <p className="text-sm text-destructive">{entryErrors.expiry_year.message}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`cert-noexpiry-${index}`}
                    checked={entry?.no_expiry ?? false}
                    onCheckedChange={(checked) => {
                      setValue(`certifications.${index}.no_expiry`, !!checked);
                      if (checked) setValue(`certifications.${index}.expiry_year`, null);
                    }}
                  />
                  <Label htmlFor={`cert-noexpiry-${index}`} className="text-sm font-normal cursor-pointer">
                    Does not expire
                  </Label>
                </div>

                <div className="flex justify-end pt-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => { remove(index); setExpandedIndex(null); }}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4 mr-1.5" />
                    Remove
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {fields.length < 20 && (
        <Button type="button" variant="outline" size="sm" onClick={addEntry} className="w-full">
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Certification
        </Button>
      )}
    </div>
  );
}
