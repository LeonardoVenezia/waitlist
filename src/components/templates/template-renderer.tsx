"use client";

import { NeonTemplate } from "./neon-template";
import { CarbonTemplate } from "./carbon-template";
import { PastelTemplate } from "./pastel-template";
import {
  normalizeTemplateData,
  type TemplateId,
  type NeonTemplateData,
  type CarbonTemplateData,
  type PastelTemplateData,
} from "@/lib/templates";

export function TemplateRenderer({
  templateId,
  templateData,
  publicKey,
  realCount,
  embedded = false,
}: {
  templateId: TemplateId;
  templateData: unknown;
  publicKey: string;
  realCount: number;
  embedded?: boolean;
}) {
  const shell = embedded
    ? "min-h-[520px] rounded-xl overflow-hidden"
    : "min-h-screen";

  if (templateId === "neon") {
    const data = normalizeTemplateData("neon", templateData) as NeonTemplateData;
    return (
      <div className={`${shell} bg-[#090A0F] flex items-center justify-center px-4 py-16`}>
        <NeonTemplate publicKey={publicKey} data={data} realCount={realCount} />
      </div>
    );
  }

  if (templateId === "carbon") {
    const data = normalizeTemplateData("carbon", templateData) as CarbonTemplateData;
    return (
      <div
        className={`${shell} bg-[#0B0C10] px-4 py-16`}
        style={{
          backgroundImage:
            "radial-gradient(circle at 50% 0%, rgba(16,185,129,0.08), transparent 50%)",
        }}
      >
        <CarbonTemplate publicKey={publicKey} data={data} realCount={realCount} />
      </div>
    );
  }

  const data = normalizeTemplateData("pastel", templateData) as PastelTemplateData;
  return (
    <div
      className={`${shell} flex items-center justify-center px-4 py-16`}
      style={{
        background:
          "linear-gradient(120deg, rgba(244,114,182,0.18), rgba(168,85,247,0.18), rgba(96,165,250,0.18))",
      }}
    >
      <PastelTemplate publicKey={publicKey} data={data} realCount={realCount} />
    </div>
  );
}
