"use client";

type OrganizerChartEvent = {
  id?: string;
  title: string;
  category: string;
  status: string;
  rsvpCount: number;
  revenue: number;
};

interface OrganizerRsvpChartsProps {
  events: OrganizerChartEvent[];
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

function getStatusColor(status: string) {
  switch (status) {
    case "approved":
      return "bg-green-500";
    case "pending":
      return "bg-yellow-500";
    case "rejected":
      return "bg-red-500";
    case "completed":
      return "bg-slate-500";
    case "cancelled":
      return "bg-rose-500";
    default:
      return "bg-slate-400";
  }
}

function getCategoryColor(index: number) {
  const colors = [
    "bg-sky-500",
    "bg-orange-500",
    "bg-emerald-500",
    "bg-fuchsia-500",
    "bg-amber-500",
    "bg-indigo-500",
  ];

  return colors[index % colors.length];
}

function HorizontalBarChart({
  items,
  labelFormatter,
  valueFormatter,
  emptyMessage,
}: {
  items: Array<{ label: string; value: number }>;
  labelFormatter?: (label: string) => string;
  valueFormatter?: (value: number) => string;
  emptyMessage: string;
}) {
  const safeItems = items.filter((item) => item.value > 0);
  const maxValue = Math.max(...safeItems.map((item) => item.value), 0);

  if (safeItems.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {safeItems.map((item) => {
        const width = maxValue === 0 ? 0 : (item.value / maxValue) * 100;
        return (
          <div key={item.label} className="space-y-1.5">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-medium text-slate-700">
                {labelFormatter ? labelFormatter(item.label) : item.label}
              </span>
              <span className="text-slate-500">
                {valueFormatter ? valueFormatter(item.value) : item.value}
              </span>
            </div>
            <div className="h-2.5 rounded-full bg-slate-100">
              <div
                className="h-2.5 rounded-full bg-brand-orange transition-[width]"
                style={{ width: `${Math.max(width, 6)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DistributionBar({
  segments,
  valueFormatter,
}: {
  segments: Array<{ label: string; value: number; className: string }>;
  valueFormatter?: (value: number) => string;
}) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);

  if (total === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
        Not enough data yet to draw this chart.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex h-4 overflow-hidden rounded-full bg-slate-100">
        {segments.map((segment) => (
          <div
            key={segment.label}
            className={segment.className}
            style={{ width: `${(segment.value / total) * 100}%` }}
            title={`${segment.label}: ${segment.value}`}
          />
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {segments.map((segment) => (
          <div key={segment.label} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
            <div className="flex items-center gap-2">
              <span className={`h-3 w-3 rounded-full ${segment.className}`} />
              <span className="font-medium text-slate-700">{segment.label}</span>
            </div>
            <span className="text-slate-500">
              {valueFormatter ? valueFormatter(segment.value) : segment.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function OrganizerRsvpCharts({
  events,
}: OrganizerRsvpChartsProps) {
  const rsvpPerEvent = [...events]
    .sort((a, b) => b.rsvpCount - a.rsvpCount)
    .slice(0, 6)
    .map((event) => ({
      label: event.title,
      value: event.rsvpCount,
    }));

  const revenuePerEvent = [...events]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 6)
    .map((event) => ({
      label: event.title,
      value: event.revenue,
    }));

  const statusCounts = Array.from(
    events.reduce((map, event) => {
      map.set(event.status, (map.get(event.status) ?? 0) + 1);
      return map;
    }, new Map<string, number>())
  ).map(([label, value]) => ({
    label,
    value,
    className: getStatusColor(label),
  }));

  const categoryCounts = Array.from(
    events.reduce((map, event) => {
      map.set(event.category, (map.get(event.category) ?? 0) + 1);
      return map;
    }, new Map<string, number>())
  ).map(([label, value], index) => ({
    label,
    value,
    className: getCategoryColor(index),
  }));

  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm xl:p-6">
      <div className="mb-6 flex flex-col gap-2 border-b border-slate-100 pb-5">
        <h3 className="text-xl font-bold tracking-tight text-brand-dark">
          RSVP Analytics
        </h3>
        <p className="text-sm text-slate-500">
          A visual snapshot of RSVP activity, estimated earnings, and event mix for this organizer.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h3 className="text-lg font-bold text-brand-dark">RSVP Count Per Event</h3>
          <p className="mt-1 text-sm text-slate-500">
            Top events by total RSVP participants.
          </p>
        </div>
        <HorizontalBarChart
          items={rsvpPerEvent}
          emptyMessage="No RSVP activity yet for this organizer."
        />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h3 className="text-lg font-bold text-brand-dark">Revenue Per Event</h3>
          <p className="mt-1 text-sm text-slate-500">
            Estimated revenue from event price multiplied by RSVP count.
          </p>
        </div>
        <HorizontalBarChart
          items={revenuePerEvent}
          valueFormatter={formatCurrency}
          emptyMessage="No paid RSVP revenue to display yet."
        />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h3 className="text-lg font-bold text-brand-dark">Event Status Distribution</h3>
          <p className="mt-1 text-sm text-slate-500">
            Breakdown of this organizer&apos;s events by status.
          </p>
        </div>
        <DistributionBar segments={statusCounts} />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h3 className="text-lg font-bold text-brand-dark">Event Category Distribution</h3>
          <p className="mt-1 text-sm text-slate-500">
            Breakdown of this organizer&apos;s events by category.
          </p>
        </div>
        <DistributionBar segments={categoryCounts} />
      </div>
      </div>
    </div>
  );
}
