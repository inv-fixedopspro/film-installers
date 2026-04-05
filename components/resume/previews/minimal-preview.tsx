"use client";

import type { ResumeFormData } from "@/lib/validations/resume";

interface MinimalPreviewProps {
  data: ResumeFormData;
  installerName?: string;
}

export function MinimalPreview({ data, installerName }: MinimalPreviewProps) {
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
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 300, letterSpacing: "0.04em", color: "#1a1a1a", margin: 0 }}>
          {installerName || "Your Name"}
        </h1>
        {data.headline && (
          <p style={{ fontSize: "11px", color: "#777", marginTop: "4px", marginBottom: 0 }}>{data.headline}</p>
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
                  <div style={{ color: "#666", fontSize: "10px" }}>{wh.company_name} · {wh.city}, {wh.state}</div>
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
