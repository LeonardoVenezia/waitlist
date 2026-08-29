"use client";

import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconChart } from "@/components/ui/icon";

interface Stats {
  total: number;
  verified: number;
  referred: number;
  pageViews: number;
  pageSignups: number;
  conversionRate: number | null;
}

interface ChartPoint {
  date: string;
  views: number;
  signups: number;
}

export function AnalyticsClient({ stats, chartData }: { stats: Stats; chartData: ChartPoint[] }) {
  const [range, setRange] = useState<"7" | "30" | "90">("30");

  const filteredData = chartData.slice(-Number(range));

  const hasData = stats.total > 0;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl">Analytics</h1>

      {!hasData ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center mb-4 text-foreground/70">
            <IconChart className="size-5" />
          </div>
          <p className="text-sm text-muted-foreground max-w-xs">
            No data yet. Analytics will appear here once subscribers start signing up.
          </p>
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">Total signups</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold tabular-nums">{stats.total}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">Via referrals</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold tabular-nums">{stats.referred}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">Verified emails</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold tabular-nums">{stats.verified}</p>
              </CardContent>
            </Card>
          </div>

          {/* Hosted page analytics */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">Hosted page analytics</h2>
              <span className="text-[11px] text-muted-foreground/60">Hosted page only — excludes embeds & API</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-3 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">Page views</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-semibold tabular-nums">{stats.pageViews}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">Signups from page</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-semibold tabular-nums">{stats.pageSignups}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">Conversion rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-semibold tabular-nums">
                    {stats.conversionRate !== null ? `${stats.conversionRate}%` : <span className="text-muted-foreground/40">—</span>}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Chart */}
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between">
                  <CardTitle className="text-base">Views & signups over time</CardTitle>
                  <div className="flex items-center gap-1">
                    {(["7", "30", "90"] as const).map((r) => (
                      <button
                        key={r}
                        onClick={() => setRange(r)}
                        className={`px-2.5 py-0.5 text-xs rounded-full border transition-colors ${
                          range === r
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-card text-muted-foreground border-input hover:text-foreground"
                        }`}
                      >
                        {r === "7" ? "7 Days" : r === "30" ? "30 Days" : "3 Months"}
                      </button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={filteredData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                      <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          background: "var(--card)",
                          border: "1px solid var(--border)",
                          borderRadius: 8,
                          fontSize: 13,
                        }}
                      />
                      <Line type="monotone" dataKey="views" stroke="#94a3b8" strokeWidth={2} dot={false} name="Views" />
                      <Line type="monotone" dataKey="signups" stroke="var(--primary)" strokeWidth={2} dot={false} name="Signups" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </section>
        </>
      )}
    </div>
  );
}
