"use client";

import type { ResumeFormData } from "@/lib/validations/resume";

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

interface StandardPreviewProps {
  data: ResumeFormData;
  installerName?: string;
}

export function StandardPreview({ data, installerName }: StandardPreviewProps) {
  return (
    <div
      className="bg-white text-[#1a1a1a] font-sans"
      style={{
        width: "816px",
        height: "1056px",
        padding: "64px 72px",
        fontSize: "11px",
        lineHeight: "1.5",
        fontFamily: "Arial, Helvetica, sans-serif",
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      <div style={{ borderBottom: "2px solid #1a1a1a", paddingBottom: "16px", marginBottom: "20px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 700, lineHeight: 1.2, letterSpacing: "-0.02em", margin: 0 }}>
          {installerName || "Your Name"}
        </h1>
        {data.headline && (
          <p style={{ fontSize: "13px", color: "#555", marginTop: "4px", marginBottom: 0 }}>{data.headline}</p>
        )}
      </div>

      {data.summary && (
        <div style={{ marginBottom: "18px" }}>
          <h2 style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px", color: "#1a1a1a" }}>Summary</h2>
          <p style={{ color: "#333", lineHeight: 1.6, margin: 0 }}>{data.summary}</p>
        </div>
      )}

      {data.skills.length > 0 && (
        <div style={{ marginBottom: "18px" }}>
          <h2 style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px", color: "#1a1a1a" }}>Skills</h2>
          <p style={{ color: "#333", margin: 0 }}>{data.skills.join(" · ")}</p>
        </div>
      )}

      {data.work_history.length > 0 && (
        <div style={{ marginBottom: "18px" }}>
          <h2 style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px", color: "#1a1a1a" }}>Work History</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {data.work_history.map((wh) => (
              <div key={wh.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontWeight: 600, fontSize: "12px" }}>{wh.job_title || "Position"}</span>
                  <span style={{ color: "#777", fontSize: "10px" }}>
                    {formatDateRange(wh.start_month, wh.start_year, wh.end_month, wh.end_year, wh.is_current)}
                  </span>
                </div>
                <div style={{ color: "#555", fontSize: "11px" }}>
                  {wh.company_name}{wh.is_self_employed ? " (Self-employed)" : ""} · {wh.city}, {wh.state}
                </div>
                {wh.description && <p style={{ marginTop: "4px", color: "#444", margin: "4px 0 0 0" }}>{wh.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {data.certifications.length > 0 && (
        <div style={{ marginBottom: "18px" }}>
          <h2 style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px", color: "#1a1a1a" }}>Certifications</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {data.certifications.map((cert) => (
              <div key={cert.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <div>
                  <span style={{ fontWeight: 500 }}>{cert.name}</span>
                  <span style={{ color: "#666", marginLeft: "4px" }}>— {cert.issuing_org}</span>
                </div>
                <span style={{ color: "#777", fontSize: "10px" }}>
                  {cert.issue_year}{cert.no_expiry ? " · No Expiry" : cert.expiry_year ? ` – ${cert.expiry_year}` : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.education.length > 0 && (
        <div>
          <h2 style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px", color: "#1a1a1a" }}>Education</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {data.education.map((edu) => (
              <div key={edu.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <div>
                  <span style={{ fontWeight: 500 }}>{edu.degree}</span>
                  {edu.field_of_study && <span style={{ color: "#555" }}>, {edu.field_of_study}</span>}
                  <div style={{ color: "#666" }}>{edu.institution}</div>
                </div>
                <span style={{ color: "#777", fontSize: "10px" }}>
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
