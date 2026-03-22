"use client";

import { useState, useEffect, useRef } from "react";
import { Copy, Check, ExternalLink, Palette, LayoutGrid, Filter, Settings2, Zap } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function WidgetConfigPage() {
  const { data: org } = trpc.organization.get.useQuery();
  const { data: venues } = trpc.venue.list.useQuery();
  const { data: eventList } = trpc.event.list.useQuery();

  // Layout & Content
  const [theme, setTheme] = useState("dark");
  const [layout, setLayout] = useState("grid");
  const [limit, setLimit] = useState("6");
  const [buttonText, setButtonText] = useState("Get Tickets");
  const [target, setTarget] = useState("_blank");
  const [showImages, setShowImages] = useState(true);
  const [showPrices, setShowPrices] = useState(true);
  const [showVenue, setShowVenue] = useState(true);

  const [transparent, setTransparent] = useState(false);

  // Filtering
  const [venue, setVenue] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);

  // Colors
  const [accent, setAccent] = useState("#c4a882");
  const [bgColor, setBgColor] = useState("");
  const [cardColor, setCardColor] = useState("");
  const [textColor, setTextColor] = useState("");
  const [btnBgColor, setBtnBgColor] = useState("");
  const [btnTextColor, setBtnTextColor] = useState("");

  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"layout" | "filter" | "colors" | "behavior">("layout");
  const previewRef = useRef<HTMLIFrameElement>(null);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://pnwtickets.com";
  const orgSlug = org?.slug ?? "pnwtickets";

  // Build attrs
  const attrs: string[] = [];
  attrs.push(`data-org="${orgSlug}"`);
  if (venue) attrs.push(`data-venue="${venue}"`);
  if (selectedEvents.length > 0) attrs.push(`data-events="${selectedEvents.join(",")}"`);
  if (transparent) attrs.push(`data-transparent="true"`);
  if (theme !== "dark") attrs.push(`data-theme="${theme}"`);
  if (limit !== "6") attrs.push(`data-limit="${limit}"`);
  if (accent !== "#c4a882") attrs.push(`data-accent="${accent}"`);
  if (layout !== "grid") attrs.push(`data-layout="${layout}"`);
  if (!showImages) attrs.push(`data-show-images="false"`);
  if (!showPrices) attrs.push(`data-show-prices="false"`);
  if (!showVenue) attrs.push(`data-show-venue="false"`);
  if (buttonText !== "Get Tickets") attrs.push(`data-button-text="${buttonText}"`);
  if (target !== "_blank") attrs.push(`data-target="${target}"`);
  if (bgColor) attrs.push(`data-bg="${bgColor}"`);
  if (cardColor) attrs.push(`data-card-bg="${cardColor}"`);
  if (textColor) attrs.push(`data-text="${textColor}"`);
  if (btnBgColor) attrs.push(`data-btn-bg="${btnBgColor}"`);
  if (btnTextColor) attrs.push(`data-btn-text="${btnTextColor}"`);

  const embedCode = `<div id="pnwt-widget"></div>\n<script src="${baseUrl}/api/widget.js"\n  ${attrs.join("\n  ")}>\n</script>`;

  function copyCode() {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    toast.success("Embed code copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  }

  const previewHtml = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:24px;background:${theme === "dark" ? "#0a0a0a" : "#f5f5f5"};min-height:100vh;">
<div id="pnwt-widget"></div>
<script src="${baseUrl}/api/widget.js" ${attrs.join(" ")}></script>
</body>
</html>`;

  useEffect(() => {
    if (previewRef.current) previewRef.current.srcdoc = previewHtml;
  }, [previewHtml]);

  const tabs = [
    { id: "layout" as const, label: "Layout", icon: LayoutGrid },
    { id: "filter" as const, label: "Content", icon: Filter },
    { id: "colors" as const, label: "Colors", icon: Palette },
    { id: "behavior" as const, label: "Behavior", icon: Settings2 },
  ];

  const upcomingEvents = eventList
    ?.filter((e) => new Date(e.startDate) >= new Date() && e.status === "published") ?? [];

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 animate-fade-in-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Embeddable Widget</h1>
        <p className="text-muted-foreground mt-1">
          Drop a single script tag onto any website to sell tickets directly.
        </p>
      </div>

      {/* Preview first — full width */}
      <Card className="admin-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="size-4" />
              Live Preview
            </CardTitle>
            <div className="flex items-center gap-3">
              <a
                href={`${baseUrl}/api/widget?org=${orgSlug}${venue ? `&venue=${venue}` : ""}&limit=${limit}`}
                target="_blank"
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                API <ExternalLink className="size-3" />
              </a>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border overflow-hidden" style={{ background: theme === "dark" ? "#0a0a0a" : "#f5f5f5" }}>
            <iframe
              ref={previewRef}
              className="w-full border-0"
              style={{ height: 520 }}
              sandbox="allow-scripts allow-same-origin"
              title="Widget Preview"
            />
          </div>
        </CardContent>
      </Card>

      {/* Config + Code side by side */}
      <div className="grid gap-6 lg:grid-cols-[1fr,380px]">
        {/* Left — Tabbed Configuration */}
        <Card className="admin-card">
          <CardHeader className="pb-0">
            <div className="flex items-center gap-1 border-b -mx-6 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors cursor-pointer ${
                      activeTab === tab.id
                        ? "border-primary text-foreground"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="size-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {/* Layout Tab */}
            {activeTab === "layout" && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Theme</Label>
                    <Select value={theme} onValueChange={(v) => setTheme(v ?? "dark")}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="light">Light</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Layout</Label>
                    <Select value={layout} onValueChange={(v) => setLayout(v ?? "grid")}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="grid">Grid</SelectItem>
                        <SelectItem value="list">List</SelectItem>
                        <SelectItem value="compact">Compact</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Max Events</Label>
                  <div className="flex items-center gap-1 rounded-lg border p-1 w-fit">
                    {["1", "2", "3", "4", "6", "8", "10", "12"].map((n) => (
                      <button
                        key={n}
                        onClick={() => setLimit(n)}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                          limit === n
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3 pt-1">
                  {[
                    { checked: transparent, set: setTransparent, label: "Transparent background (cards only, no wrapper)" },
                    { checked: showImages, set: setShowImages, label: "Show event images" },
                    { checked: showPrices, set: setShowPrices, label: "Show ticket prices" },
                    { checked: showVenue, set: setShowVenue, label: "Show venue name" },
                  ].map(({ checked, set, label }) => (
                    <label key={label} className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={checked} onChange={(e) => set(e.target.checked)} className="size-4 rounded" />
                      <span className="text-sm">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Content/Filter Tab */}
            {activeTab === "filter" && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Venue Filter</Label>
                  <Select value={venue} onValueChange={(v) => setVenue(v ?? "")}>
                    <SelectTrigger><SelectValue placeholder="All Venues" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Venues</SelectItem>
                      {venues?.map((v) => (
                        <SelectItem key={v.id} value={v.slug}>{v.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Specific Events</Label>
                  <p className="text-xs text-muted-foreground">Select individual events, or leave empty for all upcoming.</p>
                  <div className="max-h-48 overflow-y-auto rounded-lg border p-2 space-y-0.5">
                    {upcomingEvents.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-3 text-center">No upcoming published events</p>
                    ) : upcomingEvents.map((e) => (
                      <label key={e.id} className="flex items-center gap-2 py-1.5 px-2 cursor-pointer hover:bg-muted/50 rounded text-sm">
                        <input
                          type="checkbox"
                          checked={selectedEvents.includes(e.slug)}
                          onChange={(ev) => {
                            if (ev.target.checked) setSelectedEvents((p) => [...p, e.slug]);
                            else setSelectedEvents((p) => p.filter((s) => s !== e.slug));
                          }}
                          className="size-3.5 rounded"
                        />
                        <span className="truncate flex-1">{e.title}</span>
                        <span className="text-[11px] text-muted-foreground shrink-0">
                          {new Date(e.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      </label>
                    ))}
                  </div>
                  {selectedEvents.length > 0 && (
                    <button onClick={() => setSelectedEvents([])} className="text-xs text-primary hover:underline cursor-pointer">
                      Clear ({selectedEvents.length})
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Colors Tab */}
            {activeTab === "colors" && (
              <div className="space-y-5">
                <p className="text-xs text-muted-foreground">
                  Customize every color. Leave blank to use the theme defaults.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <ColorPicker label="Accent / Highlight" value={accent} onChange={setAccent} />
                  <ColorPicker label="Background" value={bgColor} onChange={setBgColor} placeholder="Theme default" />
                  <ColorPicker label="Card Background" value={cardColor} onChange={setCardColor} placeholder="Theme default" />
                  <ColorPicker label="Text Color" value={textColor} onChange={setTextColor} placeholder="Theme default" />
                  <ColorPicker label="Button Background" value={btnBgColor} onChange={setBtnBgColor} placeholder="Theme default" />
                  <ColorPicker label="Button Text" value={btnTextColor} onChange={setBtnTextColor} placeholder="Theme default" />
                </div>
                <div className="pt-2">
                  <p className="text-xs font-medium mb-2">Quick presets</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { name: "Theater Gold", accent: "#c4a882", bg: "", card: "", text: "", btn: "", btnT: "" },
                      { name: "Electric Blue", accent: "#4f8ff7", bg: "", card: "", text: "", btn: "#4f8ff7", btnT: "#ffffff" },
                      { name: "Sunset", accent: "#f97316", bg: "", card: "", text: "", btn: "#f97316", btnT: "#ffffff" },
                      { name: "Emerald", accent: "#10b981", bg: "", card: "", text: "", btn: "#10b981", btnT: "#ffffff" },
                      { name: "Rose", accent: "#f43f5e", bg: "", card: "", text: "", btn: "#f43f5e", btnT: "#ffffff" },
                      { name: "Clean White", accent: "#1a1a1a", bg: "#ffffff", card: "#f8f8f8", text: "#1a1a1a", btn: "#1a1a1a", btnT: "#ffffff" },
                    ].map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => {
                          setAccent(preset.accent);
                          setBgColor(preset.bg);
                          setCardColor(preset.card);
                          setTextColor(preset.text);
                          setBtnBgColor(preset.btn);
                          setBtnTextColor(preset.btnT);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-all cursor-pointer"
                      >
                        <span className="size-3 rounded-full" style={{ backgroundColor: preset.accent }} />
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Behavior Tab */}
            {activeTab === "behavior" && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">When customer clicks &quot;Buy&quot;</Label>
                  <Select value={target} onValueChange={(v) => setTarget(v ?? "_blank")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_blank">Open checkout in new tab</SelectItem>
                      <SelectItem value="modal">Open checkout in modal overlay</SelectItem>
                      <SelectItem value="_self">Navigate in same tab</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Button Text</Label>
                  <Input value={buttonText} onChange={(e) => setButtonText(e.target.value)} placeholder="Get Tickets" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right — Embed Code */}
        <div className="space-y-4">
          <Card className="admin-card lg:sticky lg:top-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Embed Code</CardTitle>
                <button
                  onClick={copyCode}
                  className="admin-gradient-btn inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer"
                >
                  {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                  {copied ? "Copied!" : "Copy Code"}
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <pre
                className="text-[11px] p-4 rounded-xl overflow-x-auto leading-relaxed whitespace-pre-wrap break-all"
                style={{ background: "oklch(0.13 0.01 270)", color: "oklch(0.7 0.05 150)" }}
              >
                {embedCode}
              </pre>
              <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                Paste this into any HTML page — WordPress, Squarespace, Wix, or a custom site.
                The widget loads in its own shadow DOM so it won&apos;t conflict with your site&apos;s styles.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ColorPicker({ label, value, onChange, placeholder }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex gap-2">
        <Input
          type="color"
          value={value || "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-9 p-0.5 cursor-pointer rounded-lg"
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 text-xs"
          placeholder={placeholder ?? "#hex"}
        />
        {value && (
          <button
            onClick={() => onChange("")}
            className="text-xs text-muted-foreground hover:text-foreground cursor-pointer px-1"
            title="Reset to default"
          >
            &times;
          </button>
        )}
      </div>
    </div>
  );
}
