"use client";

import type { ResumeFormData } from "@/lib/validations/resume";
import type { InstallerContactInfo } from "@/app/(protected)/dashboard/resume/page";
import { SERVICE_TYPES, EXPERIENCE_YEARS } from "@/lib/constants";

const EXPERIENCE_LEVEL_LABELS: Record<string, string> = {
  new_to_industry: "New to Industry",
  experienced: "Experienced Professional",
};

interface MinimalPreviewProps {
  data: ResumeFormData;
  installerName?: string;
  contactInfo?: InstallerContactInfo;
}

export function MinimalPreview({ data, installerName, contactInfo }: MinimalPreviewProps) {
  const showPhoto = data.show_photo && contactInfo?.photoUrl;
  const contactParts: string[] = [];
  if (contactInfo?.email) contactParts.push(contactInfo.email);
  if (contactInfo?.phone) contactParts.push(contactInfo.phone);
  if (contactInfo?.city && contactInfo?.state) contactParts.push(`${contactInfo.city}, ${contactInfo.state}`);

  return (
    <div
      style={{
        width: "816px",
        height: "1056px",
        padding: "72px 80px",
        backgroundColor: "white",
        color: "#1a1a1a",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "11px",
        lineHeight: "1.5",
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      <div style={{ marginBottom: "28px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: "22px", fontWeight: 300, letterSpacing: "0.04em", color: "#1a1a1a", margin: 0 }}>
            {installerName || "Your Name"}
          </h1>
          {data.headline && (
            <p style={{ fontSize: "11px", color: "#777", marginTop: "4px", marginBottom: 0 }}>{data.headline}</p>
          )}
          {contactInfo?.experience_level && (
            <p style={{ fontSize: "10px", color: "#aaa", marginTop: "2px", marginBottom: 0 }}>
              {EXPERIENCE_LEVEL_LABELS[contactInfo.experience_level] ?? contactInfo.experience_level}
            </p>
          )}
          {contactInfo?.experience_level === "experienced" && contactInfo.installerExperience?.length > 0 && (
            <p style={{ fontSize: "10px", color: "#bbb", marginTop: "2px", marginBottom: 0 }}>
              {contactInfo.installerExperience.map((exp) => {
                const svc = SERVICE_TYPES.find((s) => s.value === exp.service_type)?.label ?? exp.service_type;
                const yrs = EXPERIENCE_YEARS.find((y) => y.value === exp.years_experience)?.label ?? exp.years_experience;
                return `${svc}: ${yrs}`;
              }).join(" · ")}
            </p>
          )}
          {contactParts.length > 0 && (
            <p style={{ fontSize: "10px", color: "#999", marginTop: "6px", marginBottom: 0 }}>
              {contactParts.join(" · ")}
            </p>
          )}
        </div>
        {showPhoto && (
          <div style={{ marginLeft: "20px", flexShrink: 0 }}>
            <img
              src={contactInfo!.photoUrl!}
              alt=""
              style={{
                width: "72px",
                height: "72px",
                borderRadius: "4px",
                objectFit: "cover",
                border: "1px solid #e8e8e8",
              }}
            />
          </div>
        )}
      </div>

      {data.summary && (
        <div style={{ marginBottom: "20px", borderTop: "1px solid #e8e8e8", paddingTop: "14px" }}>
          <p style={{ color: "#444", lineHeight: 1.7, margin: 0 }}>{data.summary}</p>
        </div>
      )}

      {data.skills.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <h2 style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.12em", color: "#999", marginBottom: "6px" }}>Skills</h2>
          <p style={{ color: "#555", margin: 0 }}>{data.skills.join(", ")}</p>
        </div>
      )}

      {data.work_history.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <h2 style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.12em", color: "#999", marginBottom: "12px" }}>Experience</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {data.work_history.map((wh) => (
              <div key={wh.id} style={{ display: "grid", gridTemplateColumns: "64px 1fr", gap: "0 16px" }}>
                <div style={{ fontSize: "9px", color: "#aaa", paddingTop: "2px", lineHeight: 1.4 }}>
                  {wh.start_year}
                  {!wh.is_current && wh.end_year ? `–${wh.end_year}` : wh.is_current ? "–Now" : ""}
                </div>
                <div>
                  <div style={{ fontWeight: 500 }}>{wh.job_title || "Position"}</div>
                  <div style={{ color: "#666", fontSize: "10px" }}>{wh.company_name}{wh.is_self_employed ? " (Self-Employed)" : ""} · {wh.city}, {wh.state}</div>
                  {wh.description && <p style={{ marginTop: "4px", color: "#555", lineHeight: 1.6, margin: "4px 0 0 0" }}>{wh.description}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.certifications.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <h2 style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.12em", color: "#999", marginBottom: "12px" }}>Certifications</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            {data.certifications.map((cert) => (
              <div key={cert.id} style={{ display: "flex", justifyContent: "space-between" }}>
                <span>
                  {cert.name}{" "}
                  <span style={{ color: "#888" }}>— {cert.issuing_org}</span>
                </span>
                <span style={{ color: "#aaa", fontSize: "10px" }}>{cert.issue_year}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.education.length > 0 && (
        <div>
          <h2 style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.12em", color: "#999", marginBottom: "12px" }}>Education</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {data.education.map((edu) => (
              <div key={edu.id} style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <span style={{ fontWeight: 500 }}>{edu.degree}</span>
                  {edu.field_of_study && <span style={{ color: "#666" }}>, {edu.field_of_study}</span>}
                  <div style={{ color: "#888" }}>{edu.institution}</div>
                </div>
                <span style={{ color: "#aaa", fontSize: "10px" }}>
                  {edu.in_progress ? "In Progress" : edu.graduation_year || ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
