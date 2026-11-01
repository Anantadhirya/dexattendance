"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { LineDataPoint, Selection } from "./types";
import { formatChartTime } from "./utils";

type ChartEvent = { activeTooltipIndex?: number | string | null };

export default function DashboardLineChart({
  data,
  selection,
  isDimmed,
  onMouseDown,
  onMouseMove,
  onMouseUp,
}: {
  data: LineDataPoint[];
  selection: Selection | null;
  isDimmed: boolean;
  onMouseDown: (event: ChartEvent) => void;
  onMouseMove: (event: ChartEvent) => void;
  onMouseUp: (event: ChartEvent) => void;
}) {
  return (
    <div
      className={`select-none ${isDimmed ? "opacity-40" : ""} outline-none [&_*:focus]:outline-none`}
      onDragStart={(event) => event.preventDefault()}
    >
      <ResponsiveContainer width="100%" height={280}>
        <LineChart
          data={data}
          margin={{ top: 10, right: 12, left: -20, bottom: 5 }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 9 }}
            interval={17}
            angle={-45}
            textAnchor="end"
            height={55}
          />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
          <Tooltip />
          {selection?.type === "interval" && (
            <ReferenceArea
              x1={formatChartTime(selection.start)}
              x2={formatChartTime(selection.end)}
              fill="#fecaca"
              fillOpacity={0.45}
            />
          )}
          <Line
            type="monotone"
            dataKey="Active Employees"
            stroke="#b91c1c"
            strokeWidth={3}
            dot={false}
          />
          {selection?.type === "interval" && (
            <>
              <ReferenceLine
                x={formatChartTime(selection.start)}
                stroke="#991b1b"
                strokeWidth={2}
                strokeDasharray="4 4"
              />
              <ReferenceLine
                x={formatChartTime(selection.end)}
                stroke="#991b1b"
                strokeWidth={2}
                strokeDasharray="4 4"
              />
            </>
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
