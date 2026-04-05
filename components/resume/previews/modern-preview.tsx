"use client";

import type { ResumeFormData } from "@/lib/validations/resume";
import type { ResumeAccentColor } from "@/lib/types/database";

const ACCENT_HEX: Record<ResumeAccentColor, string> = {
  charcoal: "#3a3a3a",
  navy: "#1e3a5f",
  forest: "#2d5a3d",
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
}

export function ModernPreview({ data, installerName, accentColor }: ModernPreviewProps) {
  const accent = ACCENT_HEX[accentColor];

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
        <h1 style={{ fontSize: "18px", fontWeight: 700, lineHeight: 1.2, margin: "0 0 4px 0" }}>
          {installerName || "Your Name"}
        </h1>
        {data.headline && (
          <p style={{ fontSize: "10px", opacity: 0.8, margin: "0 0 24px 0", lineHeight: 1.4 }}>{data.headline}</p>
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
          padding: "48px 40px",
          boxSizing: "border-box",
          overflow: "hidden",
        }}
      >
        {data.summary && (
          <div style={{ marginBottom: "20px" }}>
            <h2 style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#555", marginBottom: "6px" }}>Profile</h2>
            <p style={{ color: "#333", lineHeight: 1.6, margin: 0 }}>{data.summary}</p>
          </div>
        )}

        {data.work_history.length > 0 && (
          <div>
            <h2 style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#555", marginBottom: "10px" }}>Experience</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {data.work_history.map((wh) => (
                <div key={wh.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <span style={{ fontWeight: 600, fontSize: "11px" }}>{wh.job_title || "Position"}</span>
                    <span style={{ fontSize: "9px", color: "#888" }}>
                      {formatDateRange(wh.start_month, wh.start_year, wh.end_month, wh.end_year, wh.is_current)}
                    </span>
                  </div>
                  <div style={{ fontSize: "10px", color: "#666" }}>
                    {wh.company_name} · {wh.city}, {wh.state}
                  </div>
                  {wh.description && <p style={{ marginTop: "3px", color: "#444", fontSize: "10px", lineHeight: 1.5, margin: "3px 0 0 0" }}>{wh.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
