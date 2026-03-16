"use client";

import { useFieldArray, Control, UseFormRegister, FieldErrors, UseFormWatch, UseFormSetValue } from "react-hook-form";
import { CirclePlus as PlusCircle, Trash2, GraduationCap, ChevronDown, ChevronUp } from "lucide-react";
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
const YEARS = Array.from({ length: currentYear - 1949 }, (_, i) => String(currentYear - i));

interface EducationFieldsProps {
  control: Control<ResumeFormData>;
  register: UseFormRegister<ResumeFormData>;
  errors: FieldErrors<ResumeFormData>;
  watch: UseFormWatch<ResumeFormData>;
  setValue: UseFormSetValue<ResumeFormData>;
}

export function EducationFields({ control, register, errors, watch, setValue }: EducationFieldsProps) {
  const { fields, append, remove } = useFieldArray({ control, name: "education" });
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const education = watch("education");

  const addEntry = () => {
    const newIndex = fields.length;
    append({
      id: generateId(),
      institution: "",
      degree: "",
      field_of_study: "",
      graduation_year: null,
      in_progress: false,
    });
    setExpandedIndex(newIndex);
  };

  return (
    <div className="space-y-3">
      {fields.length === 0 && (
        <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
          <GraduationCap className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No education added yet</p>
        </div>
      )}

      {fields.map((field, index) => {
        const entry = education?.[index];
        const entryErrors = errors.education?.[index];
        const isExpanded = expandedIndex === index;
        const label = entry?.institution || `Education ${index + 1}`;

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
                  label="Institution"
                  htmlFor={`edu-inst-${index}`}
                  error={entryErrors?.institution?.message}
                  required
                >
                  <Input
                    id={`edu-inst-${index}`}
                    placeholder="Community College of Los Angeles"
                    {...register(`education.${index}.institution`)}
                  />
                </FormField>

                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField
                    label="Degree / Program"
                    htmlFor={`edu-degree-${index}`}
                    error={entryErrors?.degree?.message}
                    required
                  >
                    <Input
                      id={`edu-degree-${index}`}
                      placeholder="Associate of Applied Science"
                      {...register(`education.${index}.degree`)}
                    />
                  </FormField>

                  <FormField
                    label="Field of Study"
                    htmlFor={`edu-field-${index}`}
                    error={entryErrors?.field_of_study?.message}
                  >
                    <Input
                      id={`edu-field-${index}`}
                      placeholder="Automotive Technology"
                      {...register(`education.${index}.field_of_study`)}
                    />
                  </FormField>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Graduation Year</Label>
                  <Select
                    value={entry?.graduation_year ?? ""}
                    disabled={entry?.in_progress}
                    onValueChange={(v) => setValue(`education.${index}.graduation_year`, v || null)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select year (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {YEARS.map((y) => (
                        <SelectItem key={y} value={y}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {entryErrors?.graduation_year && (
                    <p className="text-sm text-destructive">{entryErrors.graduation_year.message}</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`edu-inprogress-${index}`}
                    checked={entry?.in_progress ?? false}
                    onCheckedChange={(checked) => {
                      setValue(`education.${index}.in_progress`, !!checked);
                      if (checked) setValue(`education.${index}.graduation_year`, null);
                    }}
                  />
                  <Label htmlFor={`edu-inprogress-${index}`} className="text-sm font-normal cursor-pointer">
                    Currently enrolled
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

      {fields.length < 10 && (
        <Button type="button" variant="outline" size="sm" onClick={addEntry} className="w-full">
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Education
        </Button>
      )}
    </div>
  );
}
