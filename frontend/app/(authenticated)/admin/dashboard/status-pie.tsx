"use client";

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Sector,
  Tooltip,
} from "recharts";
import type { ChartStatus, Status } from "./types";

export default function StatusPie({
  data,
  colors,
  activeStatus,
  hasSelection,
  onSelect,
}: {
  data: ChartStatus[];
  colors: string[];
  activeStatus?: Status;
  hasSelection: boolean;
  onSelect: (status: Status) => void;
}) {
  const activeIndex = data.findIndex((entry) => entry.status === activeStatus);
  const hasActiveSection = activeIndex >= 0;

  return (
    <div className="mt-3 outline-none [&_*:focus]:outline-none">
      <div className="h-54">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={55}
              outerRadius={88}
              paddingAngle={0}
              shape={(props) => (
                <Sector
                  {...props}
                  outerRadius={
                    hasActiveSection && props.payload?.status === activeStatus
                      ? 93
                      : props.outerRadius
                  }
                />
              )}
              onClick={(entry) => {
                const status = data.find(
                  (item) => item.name === entry.name,
                )?.status;
                if (status) onSelect(status);
              }}
            >
              {data.map((entry, index) => (
                <Cell
                  key={entry.status}
                  fill={colors[index]}
                  opacity={
                    hasSelection
                      ? hasActiveSection && index === activeIndex
                        ? 1
                        : 0.35
                      : 1
                  }
                  className="cursor-pointer outline-none transition-opacity"
                />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-1 grid grid-cols-1 gap-1 text-xs text-zinc-600">
        {data.map((entry, index) => (
          <button
            type="button"
            key={entry.status}
            onClick={() => onSelect(entry.status)}
            className={`flex min-w-0 items-center justify-between gap-1.5 whitespace-normal break-words text-center capitalize ${
              hasSelection && (!hasActiveSection || index !== activeIndex)
                ? "opacity-40"
                : hasActiveSection
                  ? "font-semibold text-red-950"
                  : ""
            }`}
          >
            <span className="flex items-center gap-1.5">
              <span
                className="aspect-square h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: colors[index] }}
              />
              {entry.name}:
            </span>
            <span>{entry.value}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
