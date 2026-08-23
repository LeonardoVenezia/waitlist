"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateWidgetSettings, updateLeaderboardSettings } from "./actions";
import { saveTemplateData } from "../page-builder/actions";
import { getTemplateDefinition, hasTemplateAccess, type TemplateId } from "@/lib/templates";
import { TemplateRenderer } from "@/components/templates/template-renderer";
import { TemplateEditor } from "@/components/templates/template-editor";
import { buildWidgetHtml } from "@/lib/widget-html";

// ── Types ──────────────────────────────────────────────

type Tab = "design" | "install" | "leaderboard";

interface WidgetSettings {
  [key: string]: unknown;
  collect_name?: boolean;
  layout?: { corner_radius: number; font_size: number; border_width: number };
  input?: { border_color: string; background_color: string; text_color: string; placeholder_color: string };
  button?: { label: string; background_color: string; text_color: string; border_color: string };
}

interface LeaderboardSettings {
  [key: string]: unknown;
  type: string;
  show_title: boolean;
  title: string;
  subtitle: string;
  users_limit: number;
  show_referral_count: boolean;
  show_position: boolean;
  show_name: boolean;
  header_bg: string;
  header_text: string;
  odd_bg: string;
  odd_text: string;
  even_bg: string;
  even_text: string;
}

interface IntegrationClientProps {
  waitlistId: string;
  slug: string;
  publicKey: string;
  settings: Record<string, unknown>;
  plan: string;
}

// ── Color Picker Helper ────────────────────────────────

function ColorInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1.5">{label}</label>
      <div className="flex items-center gap-2">
        <label className="relative flex-shrink-0 size-9 overflow-hidden rounded-lg border cursor-pointer shadow-sm hover:border-foreground/20">
          <span className="absolute inset-1 rounded-md" style={{ backgroundColor: value }} />
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </label>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 min-w-0 px-2.5 py-2 text-xs font-mono uppercase tracking-wide bg-muted rounded-lg border border-input"
        />
      </div>
    </div>
  );
}

// ── Collapsible Section ─────────────────────────────────

function Section({
  title,
  subtitle,
  icon,
  defaultOpen = true,
  children,
}: {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-card border rounded-2xl shadow-sm">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex items-center justify-between w-full px-5 py-4 text-left rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="inline-flex items-center justify-center flex-shrink-0 size-9 text-muted-foreground bg-muted border rounded-lg">
            {icon}
          </span>
          <div className="min-w-0">
            <div className="text-[15px] font-semibold leading-tight">{title}</div>
            {subtitle && <div className="mt-0.5 text-xs text-muted-foreground">{subtitle}</div>}
          </div>
        </div>
        <svg className={`size-4 text-muted-foreground transition-transform flex-shrink-0 ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="px-5 pb-5 border-t">{children}</div>}
    </div>
  );
}

// ── Main Component ──────────────────────────────────────

export function IntegrationClient({
  waitlistId,
  slug,
  publicKey,
  settings,
  plan,
}: IntegrationClientProps) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("design");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Parse current widget/leaderboard settings from DB
  const widget = (settings.widget ?? {}) as WidgetSettings;
  const leaderboard = (settings.leaderboard ?? {}) as LeaderboardSettings;
  const pageSections = (settings.page_sections ?? {}) as Record<string, unknown>;
  const activeTemplateId = getTemplateDefinition(pageSections.template_id)?.id ?? null;
  const canUseTemplates = hasTemplateAccess(plan as never);

  const [widgetMode, setWidgetMode] = useState<"custom" | "template">(
    (widget.mode as "custom" | "template") ?? "custom",
  );
  const [templateData, setTemplateData] = useState<Record<string, unknown>>(
    (pageSections.template_data as Record<string, unknown>) ?? {},
  );

  // ── Widget state ──
  const [wCollectName, setWCollectName] = useState(widget.collect_name ?? false);
  const [wLayout, setWLayout] = useState(widget.layout ?? { corner_radius: 10, font_size: 15, border_width: 1 });
  const [wInput, setWInput] = useState(widget.input ?? { border_color: "#cccccc", background_color: "#ffffff", text_color: "#374151", placeholder_color: "#999999" });
  const [wButton, setWButton] = useState(widget.button ?? { label: "Sign Up", background_color: "#0ea5e9", text_color: "#ffffff", border_color: "#0ea5e9" });

  // ── Leaderboard state ──
  const [lbContent, setLbContent] = useState({
    type: leaderboard.type ?? "top-positions",
    show_title: leaderboard.show_title ?? false,
    title: leaderboard.title ?? "",
    subtitle: leaderboard.subtitle ?? "",
    users_limit: leaderboard.users_limit ?? 10,
  });
  const [lbColumns, setLbColumns] = useState({
    show_referral_count: leaderboard.show_referral_count ?? true,
    show_position: leaderboard.show_position ?? true,
    show_name: leaderboard.show_name ?? false,
  });
  const [lbColors, setLbColors] = useState({
    header_bg: leaderboard.header_bg ?? "#000000",
    header_text: leaderboard.header_text ?? "#ffffff",
    odd_bg: leaderboard.odd_bg ?? "#f3f4f6",
    odd_text: leaderboard.odd_text ?? "#374151",
    even_bg: leaderboard.even_bg ?? "#ffffff",
    even_text: leaderboard.even_text ?? "#222222",
  });

  // ── Install state ──
  const [installView, setInstallView] = useState<"embed" | "custom">("embed");

  // ── URLs ──
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const embedScript = `<script async src="${appUrl}/widget.js"></script>`;
  const embedDiv = `<div class="startpack-widget" data-key-id="${publicKey}"></div>`;
  const leaderboardIframe = `<iframe scrolling="yes" src="${appUrl}/w/e/${publicKey}/leaderboard" style="width: 100%; display: block; border: none; height: 100vh;"></iframe>`;
  const customAjaxCode = `<!-- Add this form to your site -->
<form id="wl-form" onsubmit="joinWaitlist(event)">
  <input type="email" id="wl-email" placeholder="you@example.com" required />
  <button type="submit">Sign Up</button>
  <p id="wl-msg"></p>
</form>

<script>
async function joinWaitlist(e) {
  e.preventDefault();
  var email = document.getElementById("wl-email").value;
  var btn = e.target.querySelector("button");
  var msg = document.getElementById("wl-msg");
  btn.disabled = true;
  try {
    var res = await fetch("${appUrl}/api/public/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ public_key: "${publicKey}", email: email }),
    });
    var data = await res.json();
    if (!res.ok) { msg.textContent = data.error; msg.style.color = "red"; btn.disabled = false; return; }
    msg.innerHTML = "✓ You're on the list! Position: #" + data.position;
    msg.style.color = "green";
    document.getElementById("wl-form").style.display = "none";
  } catch(err) {
    msg.textContent = "Network error. Try again.";
    msg.style.color = "red";
    btn.disabled = false;
  }
}
</script>`;

  // ── Save ──
  const saveWidget = useCallback(async () => {
    setSaving(true);
    const ws: WidgetSettings = {
      mode: "custom",
      collect_name: wCollectName,
      layout: wLayout,
      input: wInput,
      button: wButton,
    };
    await updateWidgetSettings(waitlistId, ws);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    router.refresh();
  }, [waitlistId, wCollectName, wLayout, wInput, wButton, router]);

  const saveLeaderboard = useCallback(async () => {
    setSaving(true);
    const ls: LeaderboardSettings = {
      ...lbContent,
      ...lbColumns,
      ...lbColors,
    };
    await updateLeaderboardSettings(waitlistId, ls);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    router.refresh();
  }, [waitlistId, lbContent, lbColumns, lbColors, router]);

  const saveTemplate = useCallback(async () => {
    if (!activeTemplateId) return;
    setSaving(true);
    await updateWidgetSettings(waitlistId, { mode: "template" });
    await saveTemplateData(waitlistId, slug, templateData);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    router.refresh();
  }, [waitlistId, slug, activeTemplateId, templateData, router]);

  const handleSave = useCallback(async () => {
    if (tab === "leaderboard") {
      await saveLeaderboard();
    } else if (widgetMode === "template") {
      await saveTemplate();
    } else {
      await saveWidget();
    }
  }, [tab, widgetMode, saveLeaderboard, saveTemplate, saveWidget]);

  const updateTemplateData = useCallback((patch: Record<string, unknown>) => {
    setTemplateData((prev) => ({ ...prev, ...patch }));
  }, []);

  // ── Copy to clipboard ──
  const [copied, setCopied] = useState<string | null>(null);
  const copy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  // ── Render ──
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold">Integration</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Build your signup widget, install it anywhere, track referrals.{" "}
            <code className="px-1.5 py-0.5 font-mono text-xs bg-muted rounded border select-all">{publicKey}</code>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {saved && <span className="text-sm text-green-600 font-medium">✓ Saved</span>}
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      {/* Tab selector */}
      <div className="inline-flex items-center gap-0.5 p-1 bg-card border rounded-full">
        {(["design", "install", "leaderboard"] as Tab[]).map((t) => {
          const icons: Record<Tab, string> = {
            design: "🎨",
            install: "📦",
            leaderboard: "🏆",
          };
          return (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium transition rounded-xl whitespace-nowrap ${
                tab === t ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {icons[t]} {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          );
        })}
      </div>

      {/* ── DESIGN TAB ── */}
      {tab === "design" && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          {/* Left: Settings */}
          <div className="lg:col-span-7 space-y-4">
            {/* Source selector */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setWidgetMode("custom")}
                className={`rounded-xl border px-4 py-3 text-left transition ${
                  widgetMode === "custom" ? "bg-card border-primary ring-1 ring-primary" : "bg-card hover:border-foreground/20"
                }`}
              >
                <span className="block text-sm font-medium">Custom widget</span>
                <span className="block text-xs text-muted-foreground mt-0.5">Build a simple signup form</span>
              </button>
              <button
                type="button"
                onClick={() => canUseTemplates && setWidgetMode("template")}
                disabled={!canUseTemplates}
                className={`rounded-xl border px-4 py-3 text-left transition ${
                  widgetMode === "template" ? "bg-card border-primary ring-1 ring-primary" : "bg-card hover:border-foreground/20 disabled:opacity-50"
                }`}
              >
                <span className="block text-sm font-medium">Page builder template</span>
                <span className="block text-xs text-muted-foreground mt-0.5">
                  {canUseTemplates ? "Use your selected template" : "Upgrade to use templates"}
                </span>
              </button>
            </div>

            {widgetMode === "custom" ? (
              <>
            {/* Layout */}
            <Section
              title="Layout"
              subtitle="Shape and spacing."
              icon={<svg className="size-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" /></svg>}
            >
              <div className="pt-4 space-y-5 divide-y">
                {/* Collect name */}
                <section className="pb-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Collect name</p>
                      <p className="text-xs text-muted-foreground">Show a name field in the widget</p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={wCollectName}
                      onClick={() => setWCollectName(!wCollectName)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${wCollectName ? "bg-primary" : "bg-muted-foreground/20"}`}
                    >
                      <span className={`inline-block size-4 rounded-full bg-white shadow-sm transition-transform ${wCollectName ? "translate-x-4" : "translate-x-0"}`} />
                    </button>
                  </div>
                </section>
                {/* Corner radius */}
                <section className="pb-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <label className="text-xs font-semibold tracking-wide uppercase">Corner radius</label>
                      <p className="mt-0.5 text-xs text-muted-foreground">Controls the roundness of fields and buttons.</p>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-semibold text-primary bg-primary/10 rounded-full border border-primary/20">{wLayout.corner_radius}px</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={24}
                    value={wLayout.corner_radius}
                    onChange={(e) => setWLayout({ ...wLayout, corner_radius: Number(e.target.value) })}
                    className="w-full mt-3"
                  />
                </section>
                {/* Font size + Border width */}
                <section className="grid grid-cols-2 gap-5 pt-5">
                  <label className="block">
                    <span className="text-xs font-semibold tracking-wide uppercase">Font size</span>
                    <select value={wLayout.font_size} onChange={(e) => setWLayout({ ...wLayout, font_size: Number(e.target.value) })} className="block w-full mt-2 px-3 py-2 text-sm bg-muted border-0 rounded-lg focus:bg-card focus:ring-2 focus:ring-primary/30">
                      {[12,13,14,15,16,17,18,19,20,21,22,23].map((s) => <option key={s} value={s}>{s}px</option>)}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold tracking-wide uppercase">Border width</span>
                    <select value={wLayout.border_width} onChange={(e) => setWLayout({ ...wLayout, border_width: Number(e.target.value) })} className="block w-full mt-2 px-3 py-2 text-sm bg-muted border-0 rounded-lg focus:bg-card focus:ring-2 focus:ring-primary/30">
                      {[1,2,3,4,5,6].map((b) => <option key={b} value={b}>{b}px</option>)}
                    </select>
                  </label>
                </section>
              </div>
            </Section>

            {/* Input colors */}
            <Section
              title="Input"
              subtitle="Border, background, and text colors."
              icon={<svg className="size-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4">
                <ColorInput label="Border" value={wInput.border_color} onChange={(v) => setWInput({ ...wInput, border_color: v })} />
                <ColorInput label="Background" value={wInput.background_color} onChange={(v) => setWInput({ ...wInput, background_color: v })} />
                <ColorInput label="Text" value={wInput.text_color} onChange={(v) => setWInput({ ...wInput, text_color: v })} />
                <ColorInput label="Placeholder" value={wInput.placeholder_color} onChange={(v) => setWInput({ ...wInput, placeholder_color: v })} />
              </div>
            </Section>

            {/* Button */}
            <Section
              title="Button"
              subtitle="CTA styling."
              icon={<svg className="size-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
            >
              <div className="pt-4 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Button label</label>
                  <Input value={wButton.label} onChange={(e) => setWButton({ ...wButton, label: e.target.value })} placeholder="Sign Up" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <ColorInput label="Background" value={wButton.background_color} onChange={(v) => setWButton({ ...wButton, background_color: v })} />
                  <ColorInput label="Text" value={wButton.text_color} onChange={(v) => setWButton({ ...wButton, text_color: v })} />
                  <ColorInput label="Border" value={wButton.border_color} onChange={(v) => setWButton({ ...wButton, border_color: v })} />
                </div>
              </div>
            </Section>
              </>
            ) : activeTemplateId ? (
              <div className="bg-card border rounded-2xl shadow-sm p-5">
                <TemplateEditor
                  templateId={activeTemplateId}
                  data={templateData}
                  onChange={updateTemplateData}
                  onSave={handleSave}
                  saving={saving}
                />
              </div>
            ) : (
              <div className="rounded-xl border bg-muted/30 p-6 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">No template selected</p>
                <p className="mt-1">Choose a template in the Page Builder first.</p>
                <a href={`/dashboard/projects/${waitlistId}/page-builder`} className="mt-3 inline-flex text-primary hover:underline">
                  Open Page Builder →
                </a>
              </div>
            )}
          </div>

          {/* Right: Preview */}
          <div className="lg:col-span-5">
            <div className="sticky top-24 overflow-hidden bg-card border rounded-2xl shadow-sm">
              <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b">
                <div>
                  <h3 className="text-sm font-semibold">Widget preview</h3>
                  <p className="text-xs text-muted-foreground">Updates as you edit</p>
                </div>
              </div>
              <div className="flex items-center px-4 py-2 bg-muted/50 border-b">
                <div className="flex items-center gap-1 mr-3 flex-shrink-0">
                  <span className="size-2.5 rounded-full bg-red-400/70" />
                  <span className="size-2.5 rounded-full bg-yellow-400/70" />
                  <span className="size-2.5 rounded-full bg-green-400/70" />
                </div>
              </div>
              <div className="p-4 bg-muted/30 min-h-[300px]">
                {widgetMode === "custom" ? (
                  <iframe
                    title="Widget preview"
                    srcDoc={buildWidgetHtml({
                      publicKey,
                      appUrl,
                      plan,
                      widget: {
                        mode: "custom",
                        collect_name: wCollectName,
                        layout: wLayout,
                        input: wInput,
                        button: wButton,
                      },
                      thankYou: (settings.thank_you ?? {}) as Record<string, unknown>,
                      preview: true,
                    })}
                    style={{ width: "100%", height: "auto", minHeight: 320, border: "none" }}
                  />
                ) : activeTemplateId ? (
                  <TemplateRenderer
                    templateId={activeTemplateId}
                    templateData={templateData}
                    publicKey={publicKey}
                    realCount={0}
                    embedded
                  />
                ) : (
                  <div className="flex items-center justify-center min-h-[300px] text-sm text-muted-foreground">
                    No template selected.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── INSTALL TAB ── */}
      {tab === "install" && (
        <div className="max-w-3xl">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 mb-6">
            <button
              type="button"
              onClick={() => setInstallView("embed")}
              className={`flex items-start w-full px-4 py-3 text-left rounded-xl border transition-colors ${
                installView === "embed" ? "bg-card border-primary ring-1 ring-primary shadow-sm" : "bg-card hover:border-foreground/20"
              }`}
            >
              <span className={`inline-flex items-center justify-center flex-shrink-0 size-9 mr-3 rounded-lg ${installView === "embed" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                <svg className="size-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
              </span>
              <div>
                <span className="block text-sm font-medium">Embed</span>
                <span className="block text-xs text-muted-foreground">Copy + paste · 2 min</span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setInstallView("custom")}
              className={`flex items-start w-full px-4 py-3 text-left rounded-xl border transition-colors ${
                installView === "custom" ? "bg-card border-primary ring-1 ring-primary shadow-sm" : "bg-card hover:border-foreground/20"
              }`}
            >
              <span className={`inline-flex items-center justify-center flex-shrink-0 size-9 mr-3 rounded-lg ${installView === "custom" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                <svg className="size-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </span>
              <div>
                <span className="block text-sm font-medium">Custom</span>
                <span className="block text-xs text-muted-foreground">HTML/CSS · 5+ min</span>
              </div>
            </button>
          </div>

          {installView === "embed" ? (
            <div className="px-8 py-6 bg-card border rounded-xl shadow-sm">
              <h3 className="text-lg font-semibold">Integrate with embed code</h3>
              <p className="mt-1 text-sm text-muted-foreground">The easiest way to show the signup form on your website.</p>

              <div className="mt-5 space-y-5">
                <div>
                  <div className="text-xs font-semibold tracking-wide text-muted-foreground uppercase mb-2">Step 1 · Add to &lt;head&gt;</div>
                  <pre className="p-4 text-white bg-gray-800 rounded-lg overflow-x-auto text-sm"><code>{embedScript}</code></pre>
                  <button onClick={() => copy("embed-script", embedScript)} className="inline-flex items-center mt-2 text-xs font-medium text-muted-foreground hover:text-foreground">
                    <svg className="size-3.5 mr-1" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                    {copied === "embed-script" ? "Copied!" : "Copy"}
                  </button>
                </div>
                <div>
                  <div className="text-xs font-semibold tracking-wide text-muted-foreground uppercase mb-2">Step 2 · Paste where the form should appear</div>
                  <pre className="p-4 text-white bg-gray-800 rounded-lg overflow-x-auto text-sm"><code>{embedDiv}</code></pre>
                  <button onClick={() => copy("embed-div", embedDiv)} className="inline-flex items-center mt-2 text-xs font-medium text-muted-foreground hover:text-foreground">
                    <svg className="size-3.5 mr-1" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                    {copied === "embed-div" ? "Copied!" : "Copy"}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">Change colors and layout in the <span className="font-medium text-foreground">Design</span> tab.</p>
              </div>
            </div>
          ) : (
            <div className="px-8 py-6 bg-card border rounded-xl shadow-sm">
              <h3 className="text-lg font-semibold">Custom integration</h3>
              <p className="mt-1 text-sm text-muted-foreground">Use the API directly to build your own form and success UI.</p>
              <div className="mt-5">
                <div className="text-xs font-semibold tracking-wide text-muted-foreground uppercase mb-2">Example</div>
                <pre className="p-4 text-white bg-gray-800 rounded-lg overflow-x-auto text-sm"><code>{customAjaxCode}</code></pre>
                <button onClick={() => copy("custom-code", customAjaxCode)} className="inline-flex items-center mt-2 text-xs font-medium text-muted-foreground hover:text-foreground">
                  <svg className="size-3.5 mr-1" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                  {copied === "custom-code" ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── LEADERBOARD TAB ── */}
      {tab === "leaderboard" && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          {/* Left: Settings */}
          <div className="lg:col-span-7 space-y-4">
            {/* Content */}
            <Section
              title="Content"
              subtitle="Title, type, and row limit."
              icon={<svg className="size-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
            >
              <div className="pt-4 space-y-4">
                <label className="block">
                  <span className="text-sm font-medium">Type</span>
                  <select value={lbContent.type} onChange={(e) => setLbContent({ ...lbContent, type: e.target.value as "top-positions" | "top-referrals" })} className="block w-full mt-1 px-3 py-2 text-sm bg-muted border-0 rounded-lg focus:bg-card focus:ring-2 focus:ring-primary/30">
                    <option value="top-positions">Top users by position</option>
                    <option value="top-referrals">Top users by referrals</option>
                  </select>
                </label>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Show title</p>
                    <p className="text-xs text-muted-foreground">If enabled, title and description will be shown at the top</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={lbContent.show_title}
                    onClick={() => setLbContent({ ...lbContent, show_title: !lbContent.show_title })}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${lbContent.show_title ? "bg-primary" : "bg-muted-foreground/20"}`}
                  >
                    <span className={`inline-block size-4 rounded-full bg-white shadow-sm transition-transform ${lbContent.show_title ? "translate-x-4" : "translate-x-0"}`} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <label className="block">
                    <span className="text-sm font-medium">Title</span>
                    <Input value={lbContent.title} onChange={(e) => setLbContent({ ...lbContent, title: e.target.value })} placeholder="Leaderboard" />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium">Subtitle</span>
                    <Input value={lbContent.subtitle} onChange={(e) => setLbContent({ ...lbContent, subtitle: e.target.value })} placeholder="Top referrers" />
                  </label>
                </div>
                <label className="block">
                  <span className="text-sm font-medium">Users limit</span>
                  <Input type="number" value={lbContent.users_limit} min={1} max={100} onChange={(e) => setLbContent({ ...lbContent, users_limit: Number(e.target.value) })} />
                </label>
              </div>
            </Section>

            {/* Columns */}
            <Section
              title="Columns"
              subtitle="Choose which details appear in each row."
              icon={<svg className="size-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>}
            >
              <div className="pt-4 space-y-4">
                {[
                  { key: "show_referral_count", label: "Show referral count" },
                  { key: "show_position", label: "Show position" },
                  { key: "show_name", label: "Show name" },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between">
                    <p className="text-sm font-medium">{label}</p>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={lbColumns[key as keyof typeof lbColumns]}
                      onClick={() => setLbColumns({ ...lbColumns, [key]: !lbColumns[key as keyof typeof lbColumns] })}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${lbColumns[key as keyof typeof lbColumns] ? "bg-primary" : "bg-muted-foreground/20"}`}
                    >
                      <span className={`inline-block size-4 rounded-full bg-white shadow-sm transition-transform ${lbColumns[key as keyof typeof lbColumns] ? "translate-x-4" : "translate-x-0"}`} />
                    </button>
                  </div>
                ))}
              </div>
            </Section>

            {/* Colors */}
            <Section
              title="Colors"
              subtitle="Header and row styling."
              icon={<svg className="size-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4">
                <ColorInput label="Header background" value={lbColors.header_bg} onChange={(v) => setLbColors({ ...lbColors, header_bg: v })} />
                <ColorInput label="Header text" value={lbColors.header_text} onChange={(v) => setLbColors({ ...lbColors, header_text: v })} />
                <ColorInput label="Odd row background" value={lbColors.odd_bg} onChange={(v) => setLbColors({ ...lbColors, odd_bg: v })} />
                <ColorInput label="Odd row text" value={lbColors.odd_text} onChange={(v) => setLbColors({ ...lbColors, odd_text: v })} />
                <ColorInput label="Even row background" value={lbColors.even_bg} onChange={(v) => setLbColors({ ...lbColors, even_bg: v })} />
                <ColorInput label="Even row text" value={lbColors.even_text} onChange={(v) => setLbColors({ ...lbColors, even_text: v })} />
              </div>
            </Section>

            {/* Install */}
            <Section
              title="Install"
              subtitle="Copy the iframe anywhere you want the leaderboard to appear."
              icon={<svg className="size-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>}
            >
              <div className="pt-4">
                <div className="text-xs font-semibold tracking-wide text-muted-foreground uppercase mb-2">Leaderboard embed code</div>
                <pre className="p-4 text-white bg-gray-800 rounded-lg overflow-x-auto text-sm"><code>{leaderboardIframe}</code></pre>
                <button onClick={() => copy("leaderboard-code", leaderboardIframe)} className="inline-flex items-center mt-2 text-xs font-medium text-muted-foreground hover:text-foreground">
                  <svg className="size-3.5 mr-1" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                  {copied === "leaderboard-code" ? "Copied!" : "Copy code"}
                </button>
              </div>
            </Section>
          </div>

          {/* Right: Preview */}
          <div className="lg:col-span-5">
            <div className="sticky top-24 overflow-hidden bg-card border rounded-2xl shadow-sm">
              <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b">
                <div>
                  <h3 className="text-sm font-semibold">Leaderboard preview</h3>
                  <p className="text-xs text-muted-foreground">Updates as you edit</p>
                </div>
              </div>
              <div className="flex items-center px-4 py-2 bg-muted/50 border-b">
                <div className="flex items-center gap-1 mr-3 flex-shrink-0">
                  <span className="size-2.5 rounded-full bg-red-400/70" />
                  <span className="size-2.5 rounded-full bg-yellow-400/70" />
                  <span className="size-2.5 rounded-full bg-green-400/70" />
                </div>
              </div>
              <div className="p-0 text-sm">
                {/* Title */}
                {lbContent.show_title && (
                  <div className="px-4 py-4 text-center">
                    {(lbContent.title || "Leaderboard") && (
                      <p className="font-semibold text-base" style={{ color: lbColors.odd_text }}>
                        {lbContent.title || "Leaderboard"}
                      </p>
                    )}
                    {lbContent.subtitle && (
                      <p className="text-xs text-muted-foreground mt-0.5">{lbContent.subtitle}</p>
                    )}
                  </div>
                )}
                {/* Header */}
                <div className="px-4 py-2 font-semibold" style={{ backgroundColor: lbColors.header_bg, color: lbColors.header_text }}>
                  {lbColumns.show_position && <span className="inline-block w-10 mr-2">#</span>}
                  {lbColumns.show_name && <span className="inline-block w-24 mr-2">Name</span>}
                  <span>Email</span>
                  {lbColumns.show_referral_count && <span className="float-right">Ref</span>}
                </div>
                {/* Rows */}
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="px-4 py-2"
                    style={{
                      backgroundColor: i % 2 === 0 ? lbColors.even_bg : lbColors.odd_bg,
                      color: i % 2 === 0 ? lbColors.even_text : lbColors.odd_text,
                    }}
                  >
                    {lbColumns.show_position && <span className="inline-block w-10 mr-2 text-xs">#{i}</span>}
                    {lbColumns.show_name && <span className="inline-block w-24 mr-2 text-xs">User {i}</span>}
                    <span className="text-xs">user{i}@example.com</span>
                    {lbColumns.show_referral_count && <span className="float-right text-xs">{5 - i}</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
