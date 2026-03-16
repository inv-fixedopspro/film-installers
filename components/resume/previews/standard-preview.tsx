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
    <div className="bg-white text-[#1a1a1a] font-sans p-8 min-h-full text-[11px] leading-relaxed">
      <div className="border-b-2 border-[#1a1a1a] pb-4 mb-5">
        <h1 className="text-[22px] font-bold leading-tight tracking-tight">
          {installerName || "Your Name"}
        </h1>
        {data.headline && (
          <p className="text-[12px] text-[#555] mt-1">{data.headline}</p>
        )}
      </div>

      {data.summary && (
        <section className="mb-5">
          <h2 className="text-[12px] font-bold uppercase tracking-wider mb-2 text-[#1a1a1a]">Summary</h2>
          <p className="text-[#333] leading-relaxed">{data.summary}</p>
        </section>
      )}

      {data.skills.length > 0 && (
        <section className="mb-5">
          <h2 className="text-[12px] font-bold uppercase tracking-wider mb-2 text-[#1a1a1a]">Skills</h2>
          <p className="text-[#333]">{data.skills.join(" · ")}</p>
        </section>
      )}

      {data.work_history.length > 0 && (
        <section className="mb-5">
          <h2 className="text-[12px] font-bold uppercase tracking-wider mb-3 text-[#1a1a1a]">Work History</h2>
          <div className="space-y-4">
            {data.work_history.map((wh) => (
              <div key={wh.id}>
                <div className="flex justify-between items-baseline">
                  <span className="font-semibold text-[12px]">{wh.job_title || "Position"}</span>
                  <span className="text-[#777] text-[10px]">
                    {formatDateRange(wh.start_month, wh.start_year, wh.end_month, wh.end_year, wh.is_current)}
                  </span>
                </div>
                <div className="text-[#555] text-[11px]">
                  {wh.company_name}{wh.is_self_employed ? " (Self-employed)" : ""} · {wh.city}, {wh.state}
                </div>
                {wh.description && <p className="mt-1 text-[#444]">{wh.description}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {data.certifications.length > 0 && (
        <section className="mb-5">
          <h2 className="text-[12px] font-bold uppercase tracking-wider mb-3 text-[#1a1a1a]">Certifications</h2>
          <div className="space-y-2">
            {data.certifications.map((cert) => (
              <div key={cert.id} className="flex justify-between items-baseline">
                <div>
                  <span className="font-medium">{cert.name}</span>
                  <span className="text-[#666] ml-1">— {cert.issuing_org}</span>
                </div>
                <span className="text-[#777] text-[10px]">
                  {cert.issue_year}{cert.no_expiry ? " · No Expiry" : cert.expiry_year ? ` – ${cert.expiry_year}` : ""}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {data.education.length > 0 && (
        <section>
          <h2 className="text-[12px] font-bold uppercase tracking-wider mb-3 text-[#1a1a1a]">Education</h2>
          <div className="space-y-2">
            {data.education.map((edu) => (
              <div key={edu.id} className="flex justify-between items-baseline">
                <div>
                  <span className="font-medium">{edu.degree}</span>
                  {edu.field_of_study && <span className="text-[#555]">, {edu.field_of_study}</span>}
                  <div className="text-[#666]">{edu.institution}</div>
                </div>
                <span className="text-[#777] text-[10px]">
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
