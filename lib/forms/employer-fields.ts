import type { FormSectionConfig, FieldConfig } from "./types";

export const employerContactFields: FieldConfig[] = [
  {
    name: "contact_first_name",
    label: "First Name",
    type: "text",
    placeholder: "John",
    required: true,
    gridColumn: "half",
  },
  {
    name: "contact_last_name",
    label: "Last Name",
    type: "text",
    placeholder: "Doe",
    required: true,
    gridColumn: "half",
  },
  {
    name: "contact_phone",
    label: "Your Phone Number",
    type: "phone",
    required: true,
    gridColumn: "full",
  },
];

export const employerCompanyFields: FieldConfig[] = [
  {
    name: "company_name",
    label: "Company Name",
    type: "text",
    placeholder: "Acme Tint Co.",
    required: true,
    gridColumn: "full",
  },
  {
    name: "company_email",
    label: "Company Email",
    type: "email",
    placeholder: "info@company.com",
    required: true,
    gridColumn: "half",
  },
  {
    name: "company_phone",
    label: "Company Phone",
    type: "phone",
    required: true,
    gridColumn: "half",
  },
  {
    name: "hq_city",
    label: "HQ City",
    type: "text",
    placeholder: "Los Angeles",
    required: true,
    gridColumn: "half",
  },
  {
    name: "hq_state",
    label: "HQ State",
    type: "state",
    required: true,
    gridColumn: "half",
  },
  {
    name: "employee_count",
    label: "Number of Employees",
    type: "employee_count",
    required: true,
    gridColumn: "half",
  },
  {
    name: "location_count",
    label: "Number of Locations",
    type: "text",
    placeholder: "e.g., 3",
    required: true,
    gridColumn: "half",
  },
];

export const employerHiringFields: FieldConfig[] = [
  {
    name: "is_actively_hiring",
    label: "Are you actively hiring?",
    type: "toggle",
    gridColumn: "full",
  },
];

export const employerServicesFields: FieldConfig[] = [
  {
    name: "services",
    label: "Services Offered",
    type: "service_checkboxes",
    required: true,
    gridColumn: "full",
    helpText: "Select all services your company offers",
  },
];

export const employerProfileSections: FormSectionConfig[] = [
  {
    id: "contact",
    title: "Contact Information",
    fields: employerContactFields,
  },
  {
    id: "company",
    title: "Company Information",
    fields: employerCompanyFields,
  },
  {
    id: "hiring",
    title: "Hiring Status",
    fields: employerHiringFields,
  },
  {
    id: "services",
    title: "Services Offered",
    description: "Select all services your company offers",
    fields: employerServicesFields,
  },
];

export const allEmployerFields: FieldConfig[] = [
  ...employerContactFields,
  ...employerCompanyFields,
  ...employerHiringFields,
  ...employerServicesFields,
];
