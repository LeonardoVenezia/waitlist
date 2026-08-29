"use client";

import { NeonTemplate } from "./neon-template";
import { CarbonTemplate } from "./carbon-template";
import { PastelTemplate } from "./pastel-template";
import { EditorialTemplate } from "./editorial-template";
import { SplitTemplate } from "./split-template";
import {
  normalizeTemplateData,
  type TemplateId,
  type NeonTemplateData,
  type CarbonTemplateData,
  type PastelTemplateData,
  type EditorialTemplateData,
  type SplitTemplateData,
} from "@/lib/templates";

export function TemplateRenderer({
  templateId,
  templateData,
  publicKey,
  realCount,
  embedded = false,
  preview = false,
}: {
  templateId: TemplateId;
  templateData: unknown;
  publicKey: string;
  realCount: number;
  embedded?: boolean;
  // ponytail: `preview` is only set by the dashboard's page builder. It
  // makes the template's subscribe hook return a mock result instead of
  // POSTing to /api/public/subscribe.
  preview?: boolean;
}) {
  const shell = embedded
    ? "min-h-[520px] rounded-xl overflow-hidden"
    : "min-h-screen";

  if (templateId === "neon") {
    const data = normalizeTemplateData("neon", templateData) as NeonTemplateData;
    return (
      <div className={`${shell} bg-[#090A0F] flex items-center justify-center px-4 py-16`}>
        <NeonTemplate publicKey={publicKey} data={data} realCount={realCount} preview={preview} />
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
        <CarbonTemplate publicKey={publicKey} data={data} realCount={realCount} preview={preview} />
      </div>
    );
  }

  if (templateId === "pastel") {
    const data = normalizeTemplateData("pastel", templateData) as PastelTemplateData;
    return (
      <div className={shell}>
        <PastelTemplate
          publicKey={publicKey}
          data={data}
          realCount={realCount}
          embedded={embedded}
          preview={preview}
        />
      </div>
    );
  }

  if (templateId === "editorial") {
    const data = normalizeTemplateData("editorial", templateData) as EditorialTemplateData;
    return (
      <div className={`${shell} bg-white px-4 py-16 flex items-center`}>
        <EditorialTemplate publicKey={publicKey} data={data} realCount={realCount} preview={preview} />
      </div>
    );
  }

  const data = normalizeTemplateData("split", templateData) as SplitTemplateData;
  return (
    <div className={`${shell} bg-[#fafafa] px-4 py-16`}>
      <SplitTemplate publicKey={publicKey} data={data} realCount={realCount} preview={preview} />
    </div>
  );
}
