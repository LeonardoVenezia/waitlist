"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageUpload } from "@/components/shared/image-upload";
import type { TemplateId } from "@/lib/templates";

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

export function TemplateEditor({
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

  if (templateId === "pastel") {
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

  if (templateId === "editorial") {
    const features = (data.features as Array<{ icon: string; title: string; description: string }>) ?? [];
    return (
      <div className="space-y-4">
        <Field label="Accent color">
          <Input value={(data.accent_color as string) ?? ""} onChange={(e) => set("accent_color", e.target.value)} />
        </Field>
        <Field label="Title">
          <Input value={(data.title as string) ?? ""} onChange={(e) => set("title", e.target.value)} />
        </Field>
        <Field label="Italic title">
          <Input value={(data.title_italic as string) ?? ""} onChange={(e) => set("title_italic", e.target.value)} />
        </Field>
        <Field label="Subtitle">
          <Input value={(data.subtitle as string) ?? ""} onChange={(e) => set("subtitle", e.target.value)} />
        </Field>
        <Field label="CTA label">
          <Input value={(data.cta_label as string) ?? ""} onChange={(e) => set("cta_label", e.target.value)} />
        </Field>
        <Field label="Features (JSON)">
          <textarea
            value={JSON.stringify(features, null, 2)}
            onChange={(e) => {
              try {
                set("features", JSON.parse(e.target.value));
              } catch {
                // keep previous value while invalid
              }
            }}
            rows={8}
            className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-xs font-mono"
          />
        </Field>
        <Field label="Launch timeline">
          <Input value={(data.launch_timeline as string) ?? ""} onChange={(e) => set("launch_timeline", e.target.value)} />
        </Field>
        <Field label="Version status">
          <Input value={(data.version_status as string) ?? ""} onChange={(e) => set("version_status", e.target.value)} />
        </Field>
        <Field label="Social X URL">
          <Input value={(data.social_x as string) ?? ""} onChange={(e) => set("social_x", e.target.value)} />
        </Field>
        <Field label="Social LinkedIn URL">
          <Input value={(data.social_linkedin as string) ?? ""} onChange={(e) => set("social_linkedin", e.target.value)} />
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

  const benefits = (data.benefits as string[]) ?? [];
  const tabs = (data.tabs as Array<{ label: string; title: string; description: string }>) ?? [];
  const testimonials = (data.testimonials as Array<{ quote: string; author: string }>) ?? [];

  return (
    <div className="space-y-4">
      <Field label="Title">
        <Input value={(data.title as string) ?? ""} onChange={(e) => set("title", e.target.value)} />
      </Field>
      <Field label="Subtitle">
        <Input value={(data.subtitle as string) ?? ""} onChange={(e) => set("subtitle", e.target.value)} />
      </Field>
      <Field label="Benefits (comma separated)">
        <FloatingTagsInput
          value={benefits}
          onChange={(v) => set("benefits", v)}
        />
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
      <Field label="Tabs (JSON)">
        <textarea
          value={JSON.stringify(tabs, null, 2)}
          onChange={(e) => {
            try {
              set("tabs", JSON.parse(e.target.value));
            } catch {
              // keep previous value while invalid
            }
          }}
          rows={8}
          className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-xs font-mono"
        />
      </Field>
      <Field label="Testimonials (JSON)">
        <textarea
          value={JSON.stringify(testimonials, null, 2)}
          onChange={(e) => {
            try {
              set("testimonials", JSON.parse(e.target.value));
            } catch {
              // keep previous value while invalid
            }
          }}
          rows={6}
          className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-xs font-mono"
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
