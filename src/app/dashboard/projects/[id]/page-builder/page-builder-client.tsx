"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageUpload } from "@/components/shared/image-upload";
import type { Section, GlobalSettings } from "./page";
import { savePageSections, selectTemplate, saveTemplateData } from "./actions";
import {
  TEMPLATE_DEFINITIONS,
  hasTemplateAccess,
  type TemplateId,
} from "@/lib/templates";
import type { Plan } from "@/lib/plans";
import { TemplateRenderer } from "@/components/templates/template-renderer";

// ── Section icons & labels ──
const SECTION_META: Record<string, { emoji: string; label: string }> = {
  hero: { emoji: "🦸", label: "Hero" },
  features: { emoji: "✨", label: "Features" },
  how_it_works: { emoji: "📋", label: "How It Works" },
  faq: { emoji: "❓", label: "FAQ" },
  form: { emoji: "📝", label: "Waitlist Form" },
  media_text: { emoji: "🖼️", label: "Media + Text" },
};

function makeSection(type: Section["type"], order: number): Section {
  const base: Section = {
    id: crypto.randomUUID(),
    type,
    visible: true,
    order,
    settings: {},
  };

  switch (type) {
    case "hero":
      base.settings = { title: "", subtitle: "", cta_label: "Join the waitlist", bg_image: "" };
      break;
    case "features":
      base.settings = { title: "Features", items: [{ icon: "✨", title: "Feature", description: "" }] };
      break;
    case "how_it_works":
      base.settings = { title: "How It Works", steps: [{ icon: "1️⃣", title: "Step 1", description: "" }] };
      break;
    case "faq":
      base.settings = { title: "FAQ", questions: [{ question: "", answer: "" }] };
      break;
    case "form":
      base.settings = { title: "", subtitle: "", button_text: "Join the waitlist", placeholder: "you@example.com" };
      break;
    case "media_text":
      base.settings = { title: "", text: "", image: "", image_side: "left" };
      break;
  }
  return base;
}

// ── Props ──
interface Props {
  waitlistId: string;
  slug: string;
  publicKey: string;
  realCount: number;
  plan: Plan;
  initialSections: Section[];
  initialGlobal: GlobalSettings;
  initialTemplateId: string | null;
  initialTemplateData: unknown;
}

// ── ColorInput helper ──
function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <label className="relative flex-shrink-0 size-9 overflow-hidden rounded-lg border cursor-pointer">
          <span className="absolute inset-1 rounded-md" style={{ backgroundColor: value }} />
          <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
        </label>
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="flex-1 min-w-0 px-2.5 py-1.5 text-xs font-mono uppercase bg-muted rounded-lg border border-input" />
      </div>
    </div>
  );
}

// ── Section Editor ──
function SectionEditor({ section, onChange }: { section: Section; onChange: (s: Section) => void }) {
  const s = section.settings;

  if (section.type === "hero") {
    return (
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Title</label>
          <Input value={(s.title as string) ?? ""} onChange={(e) => onChange({ ...section, settings: { ...s, title: e.target.value } })} placeholder="Join the waitlist" />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Subtitle</label>
          <Input value={(s.subtitle as string) ?? ""} onChange={(e) => onChange({ ...section, settings: { ...s, subtitle: e.target.value } })} placeholder="Be the first to know" />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">CTA Button Text</label>
          <Input value={(s.cta_label as string) ?? "Join the waitlist"} onChange={(e) => onChange({ ...section, settings: { ...s, cta_label: e.target.value } })} />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Background Image <span className="text-muted-foreground/60 font-normal">(optional)</span></label>
          <ImageUpload
            value={(s.bg_image as string) ?? ""}
            onChange={(v) => onChange({ ...section, settings: { ...s, bg_image: v } })}
            onRemove={() => onChange({ ...section, settings: { ...s, bg_image: "" } })}
          />
        </div>
      </div>
    );
  }

  if (section.type === "features") {
    const items = (s.items as Array<{ icon: string; title: string; description: string }>) ?? [];
    return (
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Title</label>
          <Input value={(s.title as string) ?? ""} onChange={(e) => onChange({ ...section, settings: { ...s, title: e.target.value } })} placeholder="Features" />
        </div>
        {items.map((item, i) => (
          <div key={i} className="border rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">Feature {i + 1}</span>
              <button onClick={() => {
                onChange({ ...section, settings: { ...s, items: items.filter((_, j) => j !== i) } });
              }} className="text-xs text-destructive hover:underline">Remove</button>
            </div>
            <Input value={item.icon} onChange={(e) => {
              const next = [...items]; next[i] = { ...next[i], icon: e.target.value };
              onChange({ ...section, settings: { ...s, items: next } });
            }} placeholder="Icon (emoji)" className="w-20" />
            <Input value={item.title} onChange={(e) => {
              const next = [...items]; next[i] = { ...next[i], title: e.target.value };
              onChange({ ...section, settings: { ...s, items: next } });
            }} placeholder="Feature name" />
            <Input value={item.description} onChange={(e) => {
              const next = [...items]; next[i] = { ...next[i], description: e.target.value };
              onChange({ ...section, settings: { ...s, items: next } });
            }} placeholder="Description" />
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={() => {
          onChange({ ...section, settings: { ...s, items: [...items, { icon: "✨", title: "", description: "" }] } });
        }}>Add feature</Button>
      </div>
    );
  }

  if (section.type === "how_it_works") {
    const steps = (s.steps as Array<{ icon: string; title: string; description: string }>) ?? [];
    return (
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Title</label>
          <Input value={(s.title as string) ?? ""} onChange={(e) => onChange({ ...section, settings: { ...s, title: e.target.value } })} placeholder="How It Works" />
        </div>
        {steps.map((step, i) => (
          <div key={i} className="border rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">Step {i + 1}</span>
              <button onClick={() => {
                onChange({ ...section, settings: { ...s, steps: steps.filter((_, j) => j !== i) } });
              }} className="text-xs text-destructive hover:underline">Remove</button>
            </div>
            <Input value={step.icon} onChange={(e) => {
              const next = [...steps]; next[i] = { ...next[i], icon: e.target.value };
              onChange({ ...section, settings: { ...s, steps: next } });
            }} placeholder="Icon (emoji)" className="w-20" />
            <Input value={step.title} onChange={(e) => {
              const next = [...steps]; next[i] = { ...next[i], title: e.target.value };
              onChange({ ...section, settings: { ...s, steps: next } });
            }} placeholder="Step title" />
            <Input value={step.description} onChange={(e) => {
              const next = [...steps]; next[i] = { ...next[i], description: e.target.value };
              onChange({ ...section, settings: { ...s, steps: next } });
            }} placeholder="Description" />
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={() => {
          onChange({ ...section, settings: { ...s, steps: [...steps, { icon: "1️⃣", title: "", description: "" }] } });
        }}>Add step</Button>
      </div>
    );
  }

  if (section.type === "faq") {
    const questions = (s.questions as Array<{ question: string; answer: string }>) ?? [];
    return (
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Title</label>
          <Input value={(s.title as string) ?? ""} onChange={(e) => onChange({ ...section, settings: { ...s, title: e.target.value } })} placeholder="FAQ" />
        </div>
        {questions.map((q, i) => (
          <div key={i} className="border rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">Question {i + 1}</span>
              <button onClick={() => {
                onChange({ ...section, settings: { ...s, questions: questions.filter((_, j) => j !== i) } });
              }} className="text-xs text-destructive hover:underline">Remove</button>
            </div>
            <Input value={q.question} onChange={(e) => {
              const next = [...questions]; next[i] = { ...next[i], question: e.target.value };
              onChange({ ...section, settings: { ...s, questions: next } });
            }} placeholder="Question" />
            <Input value={q.answer} onChange={(e) => {
              const next = [...questions]; next[i] = { ...next[i], answer: e.target.value };
              onChange({ ...section, settings: { ...s, questions: next } });
            }} placeholder="Answer" />
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={() => {
          onChange({ ...section, settings: { ...s, questions: [...questions, { question: "", answer: "" }] } });
        }}>Add question</Button>
    </div>
  );
  }

  if (section.type === "media_text") {
    return (
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Title <span className="text-muted-foreground/60 font-normal">(optional)</span></label>
          <Input value={(s.title as string) ?? ""} onChange={(e) => onChange({ ...section, settings: { ...s, title: e.target.value } })} />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Text</label>
          <textarea
            value={(s.text as string) ?? ""}
            onChange={(e) => onChange({ ...section, settings: { ...s, text: e.target.value } })}
            rows={3}
            className="w-full px-3 py-2 text-sm rounded-lg border bg-background resize-y focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Image</label>
          <ImageUpload
            value={(s.image as string) ?? ""}
            onChange={(v) => onChange({ ...section, settings: { ...s, image: v } })}
            onRemove={() => onChange({ ...section, settings: { ...s, image: "" } })}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Image position</label>
          <div className="flex gap-2">
            {(["left", "right"] as const).map((side) => (
              <button
                key={side}
                type="button"
                onClick={() => onChange({ ...section, settings: { ...s, image_side: side } })}
                className={`px-3 py-1.5 rounded-md text-sm border transition-colors capitalize ${
                  (s.image_side ?? "left") === side
                    ? "bg-primary text-primary-foreground border-primary"
                    : "hover:bg-accent"
                }`}
              >
                {side}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // form
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        The form inherits your widget settings (fields, styles). Edit those in the{" "}
        <span className="text-primary underline cursor-pointer">Widget Settings</span> tab.
      </p>
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">Form Title <span className="text-muted-foreground/60 font-normal">(optional)</span></label>
        <Input value={(s.title as string) ?? ""} onChange={(e) => onChange({ ...section, settings: { ...s, title: e.target.value } })} placeholder="e.g. Get Early Access" />
      </div>
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">Form Subtitle <span className="text-muted-foreground/60 font-normal">(optional)</span></label>
        <Input value={(s.subtitle as string) ?? ""} onChange={(e) => onChange({ ...section, settings: { ...s, subtitle: e.target.value } })} placeholder="Join 500+ founders on the waitlist" />
      </div>
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">Button Text</label>
        <Input value={(s.button_text as string) ?? "Join the waitlist"} onChange={(e) => onChange({ ...section, settings: { ...s, button_text: e.target.value } })} />
      </div>
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">Email Placeholder</label>
        <Input value={(s.placeholder as string) ?? "you@example.com"} onChange={(e) => onChange({ ...section, settings: { ...s, placeholder: e.target.value } })} />
      </div>
    </div>
  );
}

// ── Section List Item ──

function SectionListItem({
  section,
  idx,
  total,
  open,
  onToggleOpen,
  onRemove,
  onToggle,
  onMove,
  onUpdate,
}: {
  section: Section;
  idx: number;
  total: number;
  open: boolean;
  onToggleOpen: () => void;
  onRemove: (id: string) => void;
  onToggle: (id: string) => void;
  onMove: (id: string, dir: -1 | 1) => void;
  onUpdate: (s: Section) => void;
}) {
  const meta = SECTION_META[section.type] ?? { emoji: "📄", label: section.type };

  return (
    <div className={`border rounded-xl overflow-hidden ${!section.visible ? "opacity-60" : ""}`}>
      <div className="flex items-center gap-2 px-3 py-2.5 bg-card hover:bg-muted/50 cursor-pointer select-none" onClick={onToggleOpen}>
        <span className="text-base flex-shrink-0">{meta.emoji}</span>
        <span className="flex-1 text-sm font-medium truncate">{meta.label}</span>
        <div className="flex items-center gap-0.5 ml-auto" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => onMove(section.id, -1)} disabled={idx === 0} className="p-1 rounded transition-colors disabled:opacity-30" title="Move up">
            <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
          </button>
          <button onClick={() => onMove(section.id, 1)} disabled={idx === total - 1} className="p-1 rounded transition-colors disabled:opacity-30" title="Move down">
            <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
          </button>
          <button onClick={() => onToggle(section.id)} className="p-1 rounded transition-colors text-muted-foreground hover:text-foreground" title={section.visible ? "Hide" : "Show"}>
            <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d={section.visible ? "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" : "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M3 3l18 18"} /></svg>
          </button>
          <button onClick={() => onRemove(section.id)} className="p-1 rounded transition-colors text-muted-foreground/50 hover:text-destructive" title="Remove">
            <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <svg className="size-3.5 text-muted-foreground flex-shrink-0 transition-transform" style={{ transform: open ? "rotate(180deg)" : "" }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
      </div>
      {open && (
        <div className="border-t bg-muted/30 p-4">
          <SectionEditor section={section} onChange={onUpdate} />
        </div>
      )}
    </div>
  );
}

// ── Template Editor ──

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

function FloatingTagsInput({
  value,
  onChange,
}: {
  value: string[];
  onChange: (value: string[]) => void;
}) {
  const [text, setText] = useState(value.join(", "));

  return (
    <textarea
      value={text}
      onChange={(e) => {
        setText(e.target.value);
        onChange(e.target.value.split(",").map((s) => s.trim()).filter(Boolean));
      }}
      onBlur={() => setText(value.join(", "))}
      rows={3}
      className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
    />
  );
}

function ToggleField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 rounded-full border-2 border-transparent transition-colors ${
          checked ? "bg-primary" : "bg-muted-foreground/20"
        }`}
      >
        <span
          className={`inline-block size-4 rounded-full bg-white shadow-sm transition-transform ${
            checked ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

function TemplateEditor({
  templateId,
  data,
  onChange,
  onSave,
  saving,
}: {
  templateId: TemplateId;
  data: Record<string, unknown>;
  onChange: (patch: Record<string, unknown>) => void;
  onSave: () => void;
  saving: boolean;
}) {
  const set = (key: string, value: unknown) => onChange({ [key]: value });

  if (templateId === "neon") {
    return (
      <div className="space-y-4">
        <Field label="Badge text">
          <Input value={(data.badge_text as string) ?? ""} onChange={(e) => set("badge_text", e.target.value)} />
        </Field>
        <Field label="Title">
          <Input value={(data.title as string) ?? ""} onChange={(e) => set("title", e.target.value)} />
        </Field>
        <Field label="Subtitle">
          <Input value={(data.subtitle as string) ?? ""} onChange={(e) => set("subtitle", e.target.value)} />
        </Field>
        <Field label="CTA label">
          <Input value={(data.cta_label as string) ?? ""} onChange={(e) => set("cta_label", e.target.value)} />
        </Field>
        <Field label="Social count override">
          <Input
            value={(data.social_count_override as string) ?? ""}
            onChange={(e) => set("social_count_override", e.target.value)}
            placeholder="Leave empty to use real count"
          />
        </Field>
        <Field label="Milestone 3 label">
          <Input value={(data.milestone_3_label as string) ?? ""} onChange={(e) => set("milestone_3_label", e.target.value)} />
        </Field>
        <Field label="Milestone 5 label">
          <Input value={(data.milestone_5_label as string) ?? ""} onChange={(e) => set("milestone_5_label", e.target.value)} />
        </Field>
        <Field label="Milestone 10 label">
          <Input value={(data.milestone_10_label as string) ?? ""} onChange={(e) => set("milestone_10_label", e.target.value)} />
        </Field>
        <ToggleField
          label="Show social proof"
          checked={(data.show_social_proof as boolean) ?? true}
          onChange={(v) => set("show_social_proof", v)}
        />
        <Button size="sm" onClick={onSave} disabled={saving}>
          {saving ? "Saving…" : "Save template"}
        </Button>
      </div>
    );
  }

  if (templateId === "carbon") {
    return (
      <div className="space-y-4">
        <Field label="Eyebrow">
          <Input value={(data.eyebrow as string) ?? ""} onChange={(e) => set("eyebrow", e.target.value)} />
        </Field>
        <Field label="Title">
          <Input value={(data.title as string) ?? ""} onChange={(e) => set("title", e.target.value)} />
        </Field>
        <Field label="Emphasis word">
          <Input
            value={(data.emphasis as string) ?? ""}
            onChange={(e) => set("emphasis", e.target.value)}
            placeholder="Word to highlight with gradient"
          />
        </Field>
        <Field label="Subtitle">
          <Input value={(data.subtitle as string) ?? ""} onChange={(e) => set("subtitle", e.target.value)} />
        </Field>
        <Field label="CTA label">
          <Input value={(data.cta_label as string) ?? ""} onChange={(e) => set("cta_label", e.target.value)} />
        </Field>
        <Field label="Mockup image">
          <ImageUpload
            value={(data.mockup_image as string) ?? ""}
            onChange={(v) => set("mockup_image", v)}
            onRemove={() => set("mockup_image", "")}
          />
        </Field>
        <Field label="Social count override">
          <Input
            value={(data.social_count_override as string) ?? ""}
            onChange={(e) => set("social_count_override", e.target.value)}
            placeholder="Leave empty to use real count"
          />
        </Field>
        <ToggleField
          label="Show social proof"
          checked={(data.show_social_proof as boolean) ?? true}
          onChange={(v) => set("show_social_proof", v)}
        />
        <Button size="sm" onClick={onSave} disabled={saving}>
          {saving ? "Saving…" : "Save template"}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Field label="Badge text">
        <Input value={(data.badge_text as string) ?? ""} onChange={(e) => set("badge_text", e.target.value)} />
      </Field>
      <Field label="Title">
        <Input value={(data.title as string) ?? ""} onChange={(e) => set("title", e.target.value)} />
      </Field>
      <Field label="Subtitle">
        <Input value={(data.subtitle as string) ?? ""} onChange={(e) => set("subtitle", e.target.value)} />
      </Field>
      <Field label="CTA label">
        <Input value={(data.cta_label as string) ?? ""} onChange={(e) => set("cta_label", e.target.value)} />
      </Field>
      <Field label="Social count override">
        <Input
          value={(data.social_count_override as string) ?? ""}
          onChange={(e) => set("social_count_override", e.target.value)}
          placeholder="Leave empty to use real count"
        />
      </Field>
      <Field label="Floating tags (comma separated)">
        <FloatingTagsInput
          value={(data.floating_tags as string[]) ?? []}
          onChange={(v) => set("floating_tags", v)}
        />
      </Field>
      <ToggleField
        label="Show social proof"
        checked={(data.show_social_proof as boolean) ?? true}
        onChange={(v) => set("show_social_proof", v)}
      />
      <Button size="sm" onClick={onSave} disabled={saving}>
        {saving ? "Saving…" : "Save template"}
      </Button>
    </div>
  );
}

// ── Main Component ──

function renderPreviewSection(section: Section, s: Record<string, unknown>, global: GlobalSettings) {
  if (section.type === "hero") {
    const bgPath = (s.bg_image as string) || "";
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://localhost:54321";
    const bgUrl = bgPath
      ? bgPath.startsWith("http") ? bgPath : `${supabaseUrl}/storage/v1/object/public/showcase-images/${bgPath}`
      : "";
    return (
      <div
        key={section.id}
        className={`text-center py-16 space-y-6 relative ${bgUrl ? "bg-cover bg-center" : ""}`}
        style={bgUrl ? { backgroundImage: `url(${bgUrl})` } : undefined}
      >
        {bgUrl && <div className="absolute inset-0 bg-black/40" />}
        <div className={`relative z-10 ${bgUrl ? "text-white" : ""} space-y-6`}>
          <h1 className="text-4xl sm:text-5xl font-bold">{(s.title as string) || "Join the waitlist"}</h1>
          {(s.subtitle as string) && <p className={bgUrl ? "text-white/80" : "text-muted-foreground"}>{s.subtitle as string}</p>}
          <div className="max-w-sm mx-auto space-y-4 text-left">
            <div className="space-y-2">
              <label className={`text-sm font-medium ${bgUrl ? "text-white" : ""}`}>Email</label>
              <input type="email" placeholder="you@example.com" className="w-full px-3 py-2 rounded-lg border bg-card text-sm" disabled />
            </div>
            <button type="button" className="w-full px-4 py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: global.button_color, color: global.button_text_color }} disabled>
              {(s.cta_label as string) || "Join the waitlist"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (section.type === "features") {
    const items = (s.items as Array<{ icon: string; title: string; description: string }>) ?? [];
    return (
      <div key={section.id} className="py-8 space-y-6">
        {(s.title as string) && <h2 className="text-2xl font-bold text-center">{(s.title as string)}</h2>}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {items.map((item, i) => (
            <div key={i} className="text-center p-4 rounded-xl bg-card border">
              <div className="text-2xl mb-2">{item.icon || "✨"}</div>
              <h3 className="font-semibold">{item.title || "Feature"}</h3>
              {item.description && <p className="text-xs text-muted-foreground mt-1">{item.description}</p>}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (section.type === "how_it_works") {
    const steps = (s.steps as Array<{ icon: string; title: string; description: string }>) ?? [];
    return (
      <div key={section.id} className="py-8 space-y-6">
        {(s.title as string) && <h2 className="text-2xl font-bold text-center">{(s.title as string)}</h2>}
        <div className="space-y-4">
          {steps.map((step, i) => (
            <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-card border">
              <div className="text-2xl flex-shrink-0">{step.icon || "1️⃣"}</div>
              <div>
                <h3 className="font-semibold">{step.title || `Step ${i + 1}`}</h3>
                {step.description && <p className="text-sm text-muted-foreground mt-0.5">{step.description}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (section.type === "faq") {
    const questions = (s.questions as Array<{ question: string; answer: string }>) ?? [];
    return (
      <div key={section.id} className="py-8 space-y-4">
        {(s.title as string) && <h2 className="text-2xl font-bold text-center">{(s.title as string)}</h2>}
        <div className="space-y-2">
          {questions.map((q, i) => {
            const title = q.question || "Question";
            const body = q.answer || "";
            return (
              <details key={i} className="group rounded-xl bg-card border">
                <summary className="flex items-center justify-between p-4 cursor-pointer select-none font-medium list-none">
                  {title}
                  <svg className="size-4 text-muted-foreground transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                </summary>
                {body && <p className="px-4 pb-4 text-sm text-muted-foreground">{body}</p>}
              </details>
            );
          })}
        </div>
      </div>
    );
  }

  if (section.type === "media_text") {
    const imagePath = (s.image as string) || "";
    const imageSide = (s.image_side as string) || "left";
    const isLeft = imageSide === "left";
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://localhost:54321";
    const imageUrl = imagePath
      ? imagePath.startsWith("http") ? imagePath : `${supabaseUrl}/storage/v1/object/public/showcase-images/${imagePath}`
      : "";
    return (
      <div key={section.id} className="py-8 max-w-3xl mx-auto">
        <div className={`flex flex-col ${isLeft ? "md:flex-row" : "md:flex-row-reverse"} items-center gap-8`}>
          {imageUrl ? (
            <div className="w-full md:w-1/2">
              <img src={imageUrl} alt="" className="w-full rounded-xl object-cover h-64 md:h-80 bg-muted" />
            </div>
          ) : (
            <div className="w-full md:w-1/2 bg-muted rounded-xl h-64 md:h-80 flex items-center justify-center">
              <span className="text-sm text-muted-foreground">Image</span>
            </div>
          )}
          <div className="w-full md:w-1/2 space-y-3">
            {(s.title as string) && <h2 className="text-2xl font-bold">{(s.title as string)}</h2>}
            {(s.text as string) && <p className="text-sm text-muted-foreground whitespace-pre-line">{(s.text as string)}</p>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div key={section.id} className="py-8 max-w-sm mx-auto space-y-4 text-center">
      {(s.title as string) && <h2 className="text-xl font-bold">{(s.title as string)}</h2>}
      {(s.subtitle as string) && <p className="text-sm text-muted-foreground">{(s.subtitle as string)}</p>}
      <form className="flex flex-col gap-3" onSubmit={(e) => e.preventDefault()}>
        <input type="email" placeholder={(s.placeholder as string) || "you@example.com"} className="w-full px-3 py-2 rounded-lg border bg-card text-sm" disabled />
        <button type="button" className="w-full px-4 py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: global.button_color, color: global.button_text_color }} disabled>
          {(s.button_text as string) || "Join the waitlist"}
        </button>
      </form>
      {global.show_count && <p className="text-xs text-muted-foreground">0 signups</p>}
    </div>
  );
}

export function PageBuilderClient({
  waitlistId,
  slug,
  publicKey,
  realCount,
  plan,
  initialSections,
  initialGlobal,
  initialTemplateId,
  initialTemplateData,
}: Props) {
  const router = useRouter();
  const [sections, setSections] = useState<Section[]>(initialSections);
  const [global, setGlobal] = useState<GlobalSettings>(initialGlobal);
  const [templateId, setTemplateId] = useState<TemplateId | null>(
    initialTemplateId as TemplateId | null,
  );
  const [templateData, setTemplateData] = useState<Record<string, unknown>>(
    (initialTemplateData as Record<string, unknown>) ?? {},
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [addSectionOpen, setAddSectionOpen] = useState(false);
  const [globalOpen, setGlobalOpen] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [openSectionId, setOpenSectionId] = useState<string | null>(null);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const pageUrl = `${appUrl}/p/${slug}`;
  const canUseTemplates = hasTemplateAccess(plan);

  const save = useCallback(async () => {
    setSaving(true);
    await savePageSections(waitlistId, slug, sections, global);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    router.refresh();
  }, [waitlistId, slug, sections, global, router]);

  const handleSelectTemplate = useCallback(
    async (next: TemplateId | null) => {
      if (!canUseTemplates) return;
      if (next && next !== templateId) {
        const def = TEMPLATE_DEFINITIONS[next];
        setTemplateData(def.defaultData as unknown as Record<string, unknown>);
      }
      setSaving(true);
      await selectTemplate(waitlistId, slug, next);
      setTemplateId(next);
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      router.refresh();
    },
    [canUseTemplates, waitlistId, slug, templateId, router],
  );

  const handleSaveTemplate = useCallback(async () => {
    if (!templateId) return;
    setSaving(true);
    await saveTemplateData(waitlistId, slug, templateData);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    router.refresh();
  }, [templateId, waitlistId, slug, templateData, router]);

  const updateTemplateData = useCallback((patch: Record<string, unknown>) => {
    setTemplateData((prev) => ({ ...prev, ...patch }));
  }, []);

  const addSection = (type: Section["type"]) => {
    setSections([...sections, makeSection(type, sections.length)]);
    setAddSectionOpen(false);
  };

  const removeSection = (id: string) => {
    if (!confirm("Remove this section?")) return;
    setSections(sections.filter((s) => s.id !== id));
  };

  const toggleSection = (id: string) => {
    setSections(sections.map((s) => s.id === id ? { ...s, visible: !s.visible } : s));
  };

  const moveSection = (id: string, dir: -1 | 1) => {
    const idx = sections.findIndex((s) => s.id === id);
    if (idx === -1) return;
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= sections.length) return;
    const next = [...sections];
    [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
    setSections(next.map((s, i) => ({ ...s, order: i })));
  };

  const updateSection = (updated: Section) => {
    setSections(sections.map((s) => s.id === updated.id ? updated : s));
  };

  const copy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  const socials = [
    { label: "X", url: `https://twitter.com/intent/tweet?text=Join%20the%20waitlist&url=${encodeURIComponent(pageUrl)}`, bg: "#000" },
    { label: "Facebook", url: `https://www.facebook.com/sharer.php?u=${encodeURIComponent(pageUrl)}`, bg: "#3b5998" },
    { label: "LinkedIn", url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}`, bg: "#2867b2" },
    { label: "Reddit", url: `https://www.reddit.com/submit?url=${encodeURIComponent(pageUrl)}`, bg: "#FF4500" },
    { label: "Email", url: `mailto:?subject=Join%20the%20waitlist&body=${encodeURIComponent(pageUrl)}`, bg: "#111" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold">Page Builder</h1>
          <p className="mt-1 text-sm text-muted-foreground">Build a full landing page for your waitlist. No website needed.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShareOpen(true)}>
            <svg className="size-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
            Share
          </Button>
          <a href={pageUrl} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border rounded-lg hover:bg-muted transition-colors">
            <svg className="size-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
            Open
          </a>
        </div>
      </div>

      {/* URL bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 px-3.5 py-2.5 pr-12 font-mono text-sm bg-muted border rounded-xl truncate select-all relative">
          {pageUrl}
          <button onClick={() => copy("url", pageUrl)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md hover:bg-card transition-colors" title="Copy URL">
            {copied === "url" ? <svg className="size-4 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              : <svg className="size-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>}
          </button>
        </div>
      </div>

      {/* Save + status */}
      <div className="flex items-center gap-2">
        {saved && <span className="text-sm text-green-600 font-medium">✓ Saved</span>}
        <Button size="sm" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
      </div>

      {/* Main grid: left sections + right preview */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Sections */}
        <div className="lg:col-span-5 space-y-3">
          {/* Template selector */}
          <div className="border rounded-xl overflow-hidden">
            <button
              onClick={() => setTemplateOpen(!templateOpen)}
              className="flex items-center justify-between w-full px-4 py-3 bg-card hover:bg-muted/50 transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <span className="text-base">🎨</span>
                <span className="text-sm font-semibold">Template</span>
              </div>
              <svg
                className="size-4 text-muted-foreground transition-transform"
                style={{ transform: templateOpen ? "rotate(180deg)" : "" }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {templateOpen && (
              <div className="border-t bg-muted/30 p-4 space-y-3">
                <button
                  type="button"
                  onClick={() => handleSelectTemplate(null)}
                  className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${
                    !templateId ? "border-primary bg-primary/5" : "hover:bg-muted"
                  }`}
                >
                  <span className="font-medium">Custom builder</span>
                  <span className="block text-xs text-muted-foreground">Build your own sections</span>
                </button>
                {Object.values(TEMPLATE_DEFINITIONS).map((def) => {
                  const active = templateId === def.id;
                  const locked = !canUseTemplates;
                  return (
                    <div key={def.id} className="relative">
                      <button
                        type="button"
                        onClick={() => handleSelectTemplate(def.id)}
                        disabled={locked}
                        className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition disabled:cursor-not-allowed ${
                          active ? "border-primary bg-primary/5" : locked ? "opacity-50" : "hover:bg-muted"
                        }`}
                      >
                        <span className="font-medium">{def.thumbnail} {def.name}</span>
                        <span className="block text-xs text-muted-foreground">{def.description}</span>
                      </button>
                      {locked && (
                        <a
                          href={`/dashboard/projects/${waitlistId}/upgrade`}
                          className="absolute inset-0 flex items-center justify-center rounded-lg bg-background/60 text-xs font-medium text-primary"
                        >
                          Upgrade to use templates
                        </a>
                      )}
                    </div>
                  );
                })}
                {templateId && (
                  <div className="border-t pt-3">
                    <TemplateEditor
                      templateId={templateId}
                      data={templateData}
                      onChange={updateTemplateData}
                      onSave={handleSaveTemplate}
                      saving={saving}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {templateId ? (
            <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
              Section editing is disabled while a template is active. Choose Custom builder to edit sections.
            </div>
          ) : (
            <>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Sections</h3>
            <div className="relative">
              <button onClick={() => setAddSectionOpen(!addSectionOpen)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">
                <svg className="size-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                Add Section
              </button>
              {addSectionOpen && (
                <div className="absolute right-0 mt-1 w-52 bg-card border rounded-xl shadow-lg py-1 z-20">
                  {Object.entries(SECTION_META).map(([type, meta]) => (
                    <button key={type} onClick={() => addSection(type as Section["type"])} className="w-full flex items-center gap-2.5 px-4 py-2 text-sm hover:bg-muted transition-colors">
                      <span>{meta.emoji}</span> {meta.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Section list */}
          <div className="space-y-1.5">
            {sections.map((section, idx) => (
              <SectionListItem
                key={section.id}
                section={section}
                idx={idx}
                total={sections.length}
                open={openSectionId === section.id}
                onToggleOpen={() => setOpenSectionId(openSectionId === section.id ? null : section.id)}
                onRemove={removeSection}
                onToggle={toggleSection}
                onMove={moveSection}
                onUpdate={updateSection}
              />
            ))}
          </div>

          {/* Global Settings */}
          <div className="border rounded-xl overflow-hidden">
            <button onClick={() => setGlobalOpen(!globalOpen)} className="flex items-center justify-between w-full px-4 py-3 bg-card hover:bg-muted/50 transition-colors text-left">
              <div className="flex items-center gap-2">
                <svg className="size-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <span className="text-sm font-semibold">Global Settings</span>
              </div>
              <svg className="size-4 text-muted-foreground transition-transform" style={{ transform: globalOpen ? "rotate(180deg)" : "" }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
            </button>
            {globalOpen && (
              <div className="border-t bg-muted/30 p-4 space-y-5">
                {/* Colors */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Colors</p>
                  <div className="space-y-3">
                    <ColorInput label="Background" value={global.bg_color} onChange={(v) => setGlobal({ ...global, bg_color: v })} />
                    <ColorInput label="Button" value={global.button_color} onChange={(v) => setGlobal({ ...global, button_color: v })} />
                    <ColorInput label="Button Text" value={global.button_text_color} onChange={(v) => setGlobal({ ...global, button_text_color: v })} />
                  </div>
                </div>
                {/* Display toggles */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Display</p>
                  {[
                    { key: "show_count", label: "Show signup count" },
                    { key: "show_leaderboard", label: "Show leaderboard" },
                    { key: "show_social_links", label: "Show social links" },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center justify-between py-2">
                      <span className="text-sm">{label}</span>
                      <button
                        role="switch"
                        aria-checked={global[key as keyof GlobalSettings] as boolean}
                        onClick={() => setGlobal({ ...global, [key]: !global[key as keyof GlobalSettings] })}
                        className={`relative inline-flex h-5 w-9 rounded-full border-2 border-transparent transition-colors ${global[key as keyof GlobalSettings] ? "bg-primary" : "bg-muted-foreground/20"}`}
                      >
                        <span className={`inline-block size-4 rounded-full bg-white shadow-sm transition-transform ${global[key as keyof GlobalSettings] ? "translate-x-4" : "translate-x-0"}`} />
                      </button>
                    </div>
                  ))}
                </div>
                {/* SEO */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">SEO</p>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm">Allow search engine indexing</span>
                    <button
                      role="switch"
                      aria-checked={global.seo_indexable}
                      onClick={() => setGlobal({ ...global, seo_indexable: !global.seo_indexable })}
                      className={`relative inline-flex h-5 w-9 rounded-full border-2 border-transparent transition-colors ${global.seo_indexable ? "bg-primary" : "bg-muted-foreground/20"}`}
                    >
                      <span className={`inline-block size-4 rounded-full bg-white shadow-sm transition-transform ${global.seo_indexable ? "translate-x-4" : "translate-x-0"}`} />
                    </button>
                  </div>
                  <div className="space-y-3 mt-3">
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">SEO Title</label>
                      <Input value={global.seo_title} onChange={(e) => setGlobal({ ...global, seo_title: e.target.value })} placeholder={`Join the Waitlist — ${slug}`} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">SEO Description</label>
                      <Input value={global.seo_description} onChange={(e) => setGlobal({ ...global, seo_description: e.target.value })} placeholder="Sign up for early access." />
                    </div>
                  </div>
                </div>
                {/* Page enabled */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Page</p>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <span className="text-sm font-medium">Enable hosted page</span>
                      <p className="text-xs text-muted-foreground">When disabled, the page will return 404</p>
                    </div>
                    <button
                      role="switch"
                      aria-checked={global.page_enabled}
                      onClick={() => setGlobal({ ...global, page_enabled: !global.page_enabled })}
                      className={`relative inline-flex h-5 w-9 rounded-full border-2 border-transparent transition-colors ${global.page_enabled ? "bg-primary" : "bg-muted-foreground/20"}`}
                    >
                      <span className={`inline-block size-4 rounded-full bg-white shadow-sm transition-transform ${global.page_enabled ? "translate-x-4" : "translate-x-0"}`} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          </>
          )}
        </div>

        {/* Right: Preview */}
        <div className="lg:col-span-7">
          <div className="sticky top-24 overflow-hidden bg-card border rounded-2xl shadow-sm">
            <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b">
              <div>
                <h3 className="text-sm font-semibold">Page preview</h3>
                <p className="text-xs text-muted-foreground">Updates as you edit</p>
              </div>
              <a href={pageUrl} target="_blank" rel="noopener" className="inline-flex items-center justify-center size-7 rounded-md hover:bg-muted transition-colors" title="Open in new tab">
                <svg className="size-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
              </a>
            </div>
            <div className="flex items-center px-4 py-2 bg-muted/50 border-b">
              <span className="size-2.5 rounded-full bg-red-400/70 mr-1.5" />
              <span className="size-2.5 rounded-full bg-yellow-400/70 mr-1.5" />
              <span className="size-2.5 rounded-full bg-green-400/70 mr-3" />
              <span className="text-[11px] font-mono text-muted-foreground truncate">{pageUrl}</span>
            </div>
            {/* Preview rendered inline */}
            <div className="min-h-[500px] max-h-[700px] overflow-y-auto" style={{ backgroundColor: global.bg_color }}>
              <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 24px" }}>
                {templateId ? (
                  <TemplateRenderer
                    templateId={templateId}
                    templateData={templateData}
                    publicKey={publicKey}
                    realCount={realCount}
                    embedded
                  />
                ) : (
                  <>
                    {sections.filter((s) => s.visible).sort((a, b) => a.order - b.order).map((section) => {
                      const s = section.settings;
                      return renderPreviewSection(section, s, global);
                    })}
                    {sections.length === 0 && (
                      <div className="text-center py-16 text-muted-foreground">
                        <p className="text-sm">No sections yet. Add a section to start building your page.</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {shareOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShareOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-card rounded-2xl shadow-2xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold">Share your waitlist</h2>
                <p className="text-sm text-muted-foreground">Spread the word and grow your list.</p>
              </div>
              <button onClick={() => setShareOpen(false)} className="p-1 text-muted-foreground hover:text-foreground rounded-md transition-colors">
                <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            {/* URL */}
            <div className="relative">
              <div className="px-3.5 py-2.5 pr-12 font-mono text-sm bg-muted border rounded-xl truncate select-all">{pageUrl}</div>
              <button onClick={() => copy("modal", pageUrl)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md hover:bg-card transition-colors">
                {copied === "modal" ? <svg className="size-4 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  : <svg className="size-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>}
              </button>
            </div>
            <p className="mt-5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Share directly</p>
            <div className="mt-3 grid grid-cols-5 gap-2">
              {socials.map((s) => (
                <a key={s.label} href={s.url} target="_blank" rel="noopener" className="flex flex-col items-center gap-1.5 p-3 bg-card border rounded-xl hover:border-foreground/10 hover:bg-muted/50 transition-colors">
                  <span className="flex items-center justify-center size-9 rounded-full" style={{ backgroundColor: s.bg }}>
                    <span className="text-white text-xs font-semibold">{s.label}</span>
                  </span>
                  <span className="text-xs font-medium">{s.label}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
