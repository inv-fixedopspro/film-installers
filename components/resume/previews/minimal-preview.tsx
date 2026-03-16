"use client";

import type { ResumeFormData } from "@/lib/validations/resume";

interface MinimalPreviewProps {
  data: ResumeFormData;
  installerName?: string;
}

export function MinimalPreview({ data, installerName }: MinimalPreviewProps) {
  return (
    <div className="bg-white text-[#1a1a1a] font-sans p-10 min-h-full text-[11px] leading-relaxed">
      <div className="mb-6">
        <h1 className="text-[20px] font-light tracking-wide text-[#1a1a1a]">
          {installerName || "Your Name"}
        </h1>
        {data.headline && (
          <p className="text-[11px] text-[#777] mt-0.5">{data.headline}</p>
        )}
      </div>

      {data.summary && (
        <section className="mb-5">
          <div className="border-t border-[#e8e8e8] pt-3">
            <p className="text-[#444] leading-relaxed">{data.summary}</p>
          </div>
        </section>
      )}

      {data.skills.length > 0 && (
        <section className="mb-5">
          <h2 className="text-[10px] uppercase tracking-widest text-[#999] mb-2">Skills</h2>
          <p className="text-[#555]">{data.skills.join(", ")}</p>
        </section>
      )}

      {data.work_history.length > 0 && (
        <section className="mb-5">
          <h2 className="text-[10px] uppercase tracking-widest text-[#999] mb-3">Experience</h2>
          <div className="space-y-4">
            {data.work_history.map((wh) => (
              <div key={wh.id} className="grid grid-cols-[auto_1fr] gap-x-4">
                <div className="text-[9px] text-[#aaa] pt-0.5 whitespace-nowrap">
                  {wh.start_year}
                  {!wh.is_current && wh.end_year ? `–${wh.end_year}` : wh.is_current ? "–Now" : ""}
                </div>
                <div>
                  <div className="font-medium">{wh.job_title || "Position"}</div>
                  <div className="text-[#666] text-[10px]">{wh.company_name} · {wh.city}, {wh.state}</div>
                  {wh.description && <p className="mt-1 text-[#555]">{wh.description}</p>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {data.certifications.length > 0 && (
        <section className="mb-5">
          <h2 className="text-[10px] uppercase tracking-widest text-[#999] mb-3">Certifications</h2>
          <div className="space-y-1.5">
            {data.certifications.map((cert) => (
              <div key={cert.id} className="flex justify-between">
                <span>{cert.name} <span className="text-[#888]">— {cert.issuing_org}</span></span>
                <span className="text-[#aaa] text-[10px]">{cert.issue_year}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {data.education.length > 0 && (
        <section>
          <h2 className="text-[10px] uppercase tracking-widest text-[#999] mb-3">Education</h2>
          <div className="space-y-2">
            {data.education.map((edu) => (
              <div key={edu.id} className="flex justify-between">
                <div>
                  <span className="font-medium">{edu.degree}</span>
                  {edu.field_of_study && <span className="text-[#666]">, {edu.field_of_study}</span>}
                  <div className="text-[#888]">{edu.institution}</div>
                </div>
                <span className="text-[#aaa] text-[10px]">
                  {edu.in_progress ? "In Progress" : edu.graduation_year || ""}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
