import type { FormSectionConfig, FieldConfig } from "./types";

export const installerPersonalFields: FieldConfig[] = [
  {
    name: "first_name",
    label: "First Name",
    type: "text",
    placeholder: "John",
    required: true,
    gridColumn: "half",
  },
  {
    name: "last_name",
    label: "Last Name",
    type: "text",
    placeholder: "Doe",
    required: true,
    gridColumn: "half",
  },
  {
    name: "phone",
    label: "Phone Number",
    type: "phone",
    required: true,
    gridColumn: "full",
  },
];

export const installerLocationFields: FieldConfig[] = [
  {
    name: "city",
    label: "City",
    type: "text",
    placeholder: "Los Angeles",
    required: true,
    gridColumn: "half",
  },
  {
    name: "state",
    label: "State",
    type: "state",
    required: true,
    gridColumn: "half",
  },
];

export const installerStatusFields: FieldConfig[] = [
  {
    name: "is_actively_interviewing",
    label: "Are you actively looking for work?",
    type: "toggle",
    gridColumn: "full",
  },
];

export const installerExperienceFields: FieldConfig[] = [
  {
    name: "experience_level",
    label: "Experience Level",
    type: "experience_level",
    required: true,
    gridColumn: "full",
  },
];

export const installerProfileSections: FormSectionConfig[] = [
  {
    id: "personal",
    title: "Personal Information",
    fields: installerPersonalFields,
  },
  {
    id: "location",
    title: "Location",
    fields: installerLocationFields,
  },
  {
    id: "status",
    title: "Job Search Status",
    fields: installerStatusFields,
  },
  {
    id: "experience",
    title: "Experience",
    fields: installerExperienceFields,
  },
];

export const allInstallerFields: FieldConfig[] = [
  ...installerPersonalFields,
  ...installerLocationFields,
  ...installerStatusFields,
  ...installerExperienceFields,
];
