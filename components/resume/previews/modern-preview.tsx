"use client";

import type { ResumeFormData } from "@/lib/validations/resume";
import type { ResumeAccentColor } from "@/lib/types/database";
import type { InstallerContactInfo } from "@/app/(protected)/dashboard/resume/page";
import { SERVICE_TYPES, EXPERIENCE_YEARS } from "@/lib/constants";

const ACCENT_HEX: Record<ResumeAccentColor, string> = {
  charcoal: "#3a3a3a",
  navy: "#1e3a5f",
  forest: "#2d5a3d",
};

const EXPERIENCE_LEVEL_LABELS: Record<string, string> = {
  new_to_industry: "New to Industry",
  experienced: "Experienced Professional",
};

function formatDateRange(
  startMonth: string,
  startYear: string,
  endMonth: string | null | undefined,
  endYear: string | null | undefined,
  isCurrent: boolean
): string {
  const start = `${startMonth} ${startYear}`;
  const end = isCurrent ? "Present" : endMonth && endYear ? `${endMonth} ${endYear}` : "";
  return end ? `${start} – ${end}` : start;
}

interface ModernPreviewProps {
  data: ResumeFormData;
  installerName?: string;
  accentColor: ResumeAccentColor;
  contactInfo?: InstallerContactInfo;
}

export function ModernPreview({ data, installerName, accentColor, contactInfo }: ModernPreviewProps) {
  const accent = ACCENT_HEX[accentColor];
  const showPhoto = data.show_photo && contactInfo?.photoUrl;

  return (
    <div
      style={{
        width: "816px",
        height: "1056px",
        display: "flex",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "11px",
        lineHeight: "1.5",
        color: "#1a1a1a",
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "290px",
          flexShrink: 0,
          height: "1056px",
          padding: "48px 28px",
          backgroundColor: accent,
          color: "white",
          boxSizing: "border-box",
          overflow: "hidden",
        }}
      >
        {showPhoto && (
          <div style={{ marginBottom: "16px", display: "flex", justifyContent: "center" }}>
            <img
              src={contactInfo!.photoUrl!}
              alt=""
              style={{
                width: "72px",
                height: "72px",
                borderRadius: "50%",
                objectFit: "cover",
                border: "2px solid rgba(255,255,255,0.4)",
              }}
            />
          </div>
        )}

        <h1 style={{ fontSize: "18px", fontWeight: 700, lineHeight: 1.2, margin: "0 0 4px 0" }}>
          {installerName || "Your Name"}
        </h1>
        {data.headline && (
          <p style={{ fontSize: "10px", opacity: 0.8, margin: "0 0 4px 0", lineHeight: 1.4 }}>{data.headline}</p>
        )}
        {contactInfo?.experience_level && (
          <p style={{ fontSize: "9px", opacity: 0.65, margin: "0 0 4px 0" }}>
            {EXPERIENCE_LEVEL_LABELS[contactInfo.experience_level] ?? contactInfo.experience_level}
          </p>
        )}
        {contactInfo?.experience_level === "experienced" && contactInfo.installerExperience?.length > 0 && (
          <div style={{ marginBottom: "16px" }}>
            {contactInfo.installerExperience.map((exp) => {
              const svc = SERVICE_TYPES.find((s) => s.value === exp.service_type)?.label ?? exp.service_type;
              const yrs = EXPERIENCE_YEARS.find((y) => y.value === exp.years_experience)?.label ?? exp.years_experience;
              return (
                <div key={exp.service_type} style={{ fontSize: "9px", opacity: 0.55 }}>{svc}: {yrs}</div>
              );
            })}
          </div>
        )}
        {contactInfo?.experience_level !== "experienced" && <div style={{ marginBottom: "16px" }} />}

        {(contactInfo?.email || contactInfo?.phone || (contactInfo?.city && contactInfo?.state)) && (
          <div style={{ marginBottom: "20px" }}>
            <h2 style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", opacity: 0.7, marginBottom: "8px" }}>Contact</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
              {contactInfo?.email && <div style={{ fontSize: "9px", opacity: 0.85, wordBreak: "break-all" }}>{contactInfo.email}</div>}
              {contactInfo?.phone && <div style={{ fontSize: "9px", opacity: 0.85 }}>{contactInfo.phone}</div>}
              {contactInfo?.city && contactInfo?.state && (
                <div style={{ fontSize: "9px", opacity: 0.85 }}>{contactInfo.city}, {contactInfo.state}</div>
              )}
            </div>
          </div>
        )}

        {data.skills.length > 0 && (
          <div style={{ marginBottom: "20px" }}>
            <h2 style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", opacity: 0.7, marginBottom: "8px" }}>Skills</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
              {data.skills.slice(0, 12).map((skill, i) => (
                <div key={i} style={{ fontSize: "10px", opacity: 0.9 }}>{skill}</div>
              ))}
              {data.skills.length > 12 && (
                <div style={{ fontSize: "10px", opacity: 0.6 }}>+{data.skills.length - 12} more</div>
              )}
            </div>
          </div>
        )}

        {data.certifications.length > 0 && (
          <div style={{ marginBottom: "20px" }}>
            <h2 style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", opacity: 0.7, marginBottom: "8px" }}>Certifications</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {data.certifications.map((cert) => (
                <div key={cert.id}>
                  <p style={{ fontSize: "10px", fontWeight: 500, margin: 0 }}>{cert.name}</p>
                  <p style={{ fontSize: "9px", opacity: 0.7, margin: 0 }}>{cert.issuing_org} · {cert.issue_year}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.education.length > 0 && (
          <div>
            <h2 style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", opacity: 0.7, marginBottom: "8px" }}>Education</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {data.education.map((edu) => (
                <div key={edu.id}>
                  <p style={{ fontSize: "10px", fontWeight: 500, margin: 0 }}>{edu.degree}</p>
                  <p style={{ fontSize: "9px", opacity: 0.7, margin: 0 }}>{edu.institution}</p>
                  {edu.field_of_study && <p style={{ fontSize: "9px", opacity: 0.6, margin: 0 }}>{edu.field_of_study}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div
        style={{
          flex: 1,
          padding: "56px 48px",
          boxSizing: "border-box",
          overflow: "hidden",
        }}
      >
        {data.summary && (
          <div style={{ marginBottom: "32px" }}>
            <h2 style={{ fontSize: "13px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: accent, marginBottom: "14px", borderBottom: `2px solid ${accent}`, paddingBottom: "8px" }}>Profile</h2>
            <p style={{ color: "#333", lineHeight: 1.8, margin: 0, fontSize: "13px" }}>{data.summary}</p>
          </div>
        )}

        {data.work_history.length > 0 && (
          <div>
            <h2 style={{ fontSize: "13px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: accent, marginBottom: "18px", borderBottom: `2px solid ${accent}`, paddingBottom: "8px" }}>Experience</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {data.work_history.map((wh) => (
                <div key={wh.id} style={{ paddingBottom: "16px", borderBottom: "1px solid #e5e5e5" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                    <span style={{ fontWeight: 700, fontSize: "14px", color: "#1a1a1a" }}>{wh.job_title || "Position"}</span>
                    <span style={{ fontSize: "11px", color: "#666", fontWeight: 500 }}>
                      {formatDateRange(wh.start_month, wh.start_year, wh.end_month, wh.end_year, wh.is_current)}
                    </span>
                  </div>
                  <div style={{ fontSize: "12px", color: "#555", marginBottom: "8px", fontWeight: 500 }}>
                    {wh.company_name}{wh.is_self_employed ? " (Self-Employed)" : ""} · {wh.city}, {wh.state}
                  </div>
                  {wh.description && <p style={{ color: "#444", fontSize: "12px", lineHeight: 1.7, margin: 0 }}>{wh.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
