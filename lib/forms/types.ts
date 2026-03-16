export type FieldType =
  | "text"
  | "email"
  | "password"
  | "phone"
  | "textarea"
  | "select"
  | "checkbox"
  | "toggle"
  | "state"
  | "employee_count"
  | "service_checkboxes"
  | "experience_level"
  | "years_experience";

export interface FieldOption {
  value: string;
  label: string;
}

export interface FieldConfig {
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  required?: boolean;
  helpText?: string;
  options?: FieldOption[];
  dependsOn?: {
    field: string;
    value: unknown;
  };
  gridColumn?: "full" | "half";
}

export interface FormSectionConfig {
  id: string;
  title: string;
  description?: string;
  fields: FieldConfig[];
}

export interface FormConfig {
  id: string;
  sections: FormSectionConfig[];
}
