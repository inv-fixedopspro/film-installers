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
    <div className="bg-white text-[#1a1a1a] font-sans flex min-h-full text-[11px] leading-relaxed">
      <div className="w-[38%] min-h-full p-5 text-white" style={{ backgroundColor: accent }}>
        <h1 className="text-[16px] font-bold leading-tight mb-1">
          {installerName || "Your Name"}
        </h1>
        {data.headline && (
          <p className="text-[10px] opacity-80 mb-4">{data.headline}</p>
        )}

        {data.skills.length > 0 && (
          <div className="mb-4">
            <h2 className="text-[10px] font-bold uppercase tracking-wider mb-2 opacity-70">Skills</h2>
            <div className="space-y-1">
              {data.skills.slice(0, 10).map((skill, i) => (
                <div key={i} className="text-[10px] opacity-90">{skill}</div>
              ))}
              {data.skills.length > 10 && (
                <div className="text-[10px] opacity-60">+{data.skills.length - 10} more</div>
              )}
            </div>
          </div>
        )}

        {data.certifications.length > 0 && (
          <div className="mb-4">
            <h2 className="text-[10px] font-bold uppercase tracking-wider mb-2 opacity-70">Certifications</h2>
            <div className="space-y-1.5">
              {data.certifications.map((cert) => (
                <div key={cert.id}>
                  <p className="text-[10px] font-medium">{cert.name}</p>
                  <p className="text-[9px] opacity-70">{cert.issuing_org} · {cert.issue_year}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.education.length > 0 && (
          <div>
            <h2 className="text-[10px] font-bold uppercase tracking-wider mb-2 opacity-70">Education</h2>
            <div className="space-y-1.5">
              {data.education.map((edu) => (
                <div key={edu.id}>
                  <p className="text-[10px] font-medium">{edu.degree}</p>
                  <p className="text-[9px] opacity-70">{edu.institution}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 p-5">
        {data.summary && (
          <div className="mb-4">
            <h2 className="text-[11px] font-bold uppercase tracking-wider mb-1.5 text-[#555]">Profile</h2>
            <p className="text-[#333]">{data.summary}</p>
          </div>
        )}

        {data.work_history.length > 0 && (
          <div>
            <h2 className="text-[11px] font-bold uppercase tracking-wider mb-2 text-[#555]">Experience</h2>
            <div className="space-y-3">
              {data.work_history.map((wh) => (
                <div key={wh.id}>
                  <div className="flex justify-between items-baseline">
                    <span className="font-semibold text-[11px]">{wh.job_title || "Position"}</span>
                    <span className="text-[9px] text-[#888]">
                      {formatDateRange(wh.start_month, wh.start_year, wh.end_month, wh.end_year, wh.is_current)}
                    </span>
                  </div>
                  <div className="text-[10px] text-[#666]">
                    {wh.company_name} · {wh.city}, {wh.state}
                  </div>
                  {wh.description && <p className="mt-0.5 text-[#444]">{wh.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
