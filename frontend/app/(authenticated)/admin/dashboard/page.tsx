"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import LoadingOverlay from "../../../../components/loading-overlay";
import ChartCard from "./chart-card";
import DashboardDetailsPanel from "./details-panel";
import DashboardLineChart from "./line-chart";
import StatusPie from "./status-pie";
import type {
  Attendance,
  ChartStatus,
  LineDataPoint,
  Selection,
  Status,
  User,
} from "./types";
import {
  currentLocalMinute,
  firstChartColors,
  formatChartTime,
  localDateKey,
  secondChartColors,
  statusFor,
  timeOf,
} from "./utils";

type ChartEvent = { activeTooltipIndex?: number | string | null };

export default function AdminDashboardPage() {
  const [date, setDate] = useState(localDateKey);
  const [users, setUsers] = useState<User[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [hasDragged, setHasDragged] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  const isToday = date === localDateKey();
  const nowMinute = isToday ? currentLocalMinute() : 1439;

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const query = new URLSearchParams({
        date,
        timezoneOffsetMinutes: String(new Date().getTimezoneOffset()),
      });
      const response = await fetch(`${apiUrl}/attendances/dashboard?${query}`, {
        credentials: "include",
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message ?? "Unable to load dashboard data");
      }
      setUsers(result.users);
      setAttendances(result.attendances);
      setSelection(null);
      setDragStart(null);
      setHasDragged(false);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load dashboard data",
      );
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl, date]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadDashboard(), 0);
    return () => window.clearTimeout(timer);
  }, [loadDashboard]);

  const userStatuses = useMemo(() => {
    const recordsByUser = new Map<string, Attendance[]>();
    for (const attendance of attendances) {
      recordsByUser.set(attendance.userId, [
        ...(recordsByUser.get(attendance.userId) ?? []),
        attendance,
      ]);
    }
    return users.map((user) => ({
      user,
      ...statusFor(user, recordsByUser.get(user.id) ?? []),
    }));
  }, [attendances, users]);

  const attendanceChart = useMemo(
    () =>
      makeChart([
        ["missing", "Missing"],
        ["checked_in", "Clocked in"],
        ["checked_out", "Clocked out"],
      ], userStatuses.map((item) => item.attendance)),
    [userStatuses],
  );
  const punctualityChart = useMemo(
    () =>
      makeChart(
        [
          ["missing", "Missing"],
          ["late", "Late"],
          ["on_time", "On time"],
        ],
        userStatuses.map((item) => item.punctuality),
      ),
    [userStatuses],
  );

  const lineData = useMemo<LineDataPoint[]>(
    () =>
      Array.from({ length: 145 }, (_, index) => {
        const minute = index * 10;
        const activeEmployees = users.reduce((count, user) => {
          const latestRecord = attendances
            .filter(
              (attendance) =>
                attendance.userId === user.id &&
                timeOf(attendance.timestamp) <= minute,
            )
            .at(-1);
          return count + (latestRecord?.type === "check_in" ? 1 : 0);
        }, 0);
        return {
          minute,
          label: formatChartTime(minute),
          "Active Employees":
            !isToday || minute <= nowMinute ? Math.max(0, activeEmployees) : null,
        };
      }),
    [attendances, isToday, nowMinute, users],
  );

  const intervalRecords = useMemo(
    () =>
      attendances
        .filter((attendance) => {
          const interval =
            selection?.type === "interval"
              ? selection
              : { start: 0, end: nowMinute };
          const minute = timeOf(attendance.timestamp);
          return minute >= interval.start && minute <= interval.end;
        })
        .sort(
          (left, right) =>
            new Date(right.timestamp).getTime() -
            new Date(left.timestamp).getTime(),
        ),
    [attendances, nowMinute, selection],
  );

  const selectedUsers = useMemo(() => {
    if (selection?.type !== "status") return [];
    return userStatuses
      .filter(
        (item) =>
          item.attendance === selection.status ||
          item.punctuality === selection.status,
      )
      .sort((left, right) => {
        if (selection.status === "missing") {
          return left.user.name.localeCompare(right.user.name);
        }
        const leftTimestamp =
          selection.status === "checked_out"
            ? left.checkOut?.timestamp
            : left.checkIn?.timestamp;
        const rightTimestamp =
          selection.status === "checked_out"
            ? right.checkOut?.timestamp
            : right.checkIn?.timestamp;
        return (
          new Date(rightTimestamp ?? 0).getTime() -
          new Date(leftTimestamp ?? 0).getTime()
        );
      });
  }, [selection, userStatuses]);

  const getChartMinute = (event: ChartEvent) => {
    const index = Number(event.activeTooltipIndex);
    return Number.isInteger(index) && index >= 0 && index <= 144
      ? index * 10
      : null;
  };
  const handleLineChartMouseDown = (event: ChartEvent) => {
    const minute = getChartMinute(event);
    if (minute !== null) {
      setDragStart(minute);
      setHasDragged(false);
      setSelection({ type: "interval", start: minute, end: minute });
    }
  };
  const handleLineChartMouseMove = (event: ChartEvent) => {
    if (dragStart === null) return;
    const minute = getChartMinute(event);
    if (minute === null) return;
    if (minute !== dragStart) setHasDragged(true);
    setSelection({
      type: "interval",
      start: Math.min(dragStart, minute),
      end: Math.max(dragStart, minute),
    });
  };
  const handleLineChartMouseUp = (event: ChartEvent) => {
    const minute = getChartMinute(event);
    if (dragStart === null || minute === null) return;
    if (!hasDragged && selection?.type === "interval") {
      setDragStart(null);
      setSelection(null);
      return;
    }
    const start = Math.min(dragStart, minute);
    const end = Math.max(dragStart, minute);
    setDragStart(null);
    setHasDragged(false);
    setSelection(
      start === 0 && end === 1440 ? null : { type: "interval", start, end },
    );
  };

  const selectedStatus =
    selection?.type === "status" ? selection.status : undefined;
  const selectedInterval =
    selection?.type === "interval"
      ? selection
      : { start: 0, end: nowMinute };

  const selectStatus = (status: Status) => {
    setSelection((current) =>
      current?.type === "status" && current.status === status
        ? null
        : { type: "status", status },
    );
  };

  return (
    <section>
      <DashboardHeader date={date} onDateChange={setDate} />
      {error && (
        <p role="alert" className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="relative mt-8 grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        {isLoading && <LoadingOverlay label="Loading dashboard" />}
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <ChartCard title="Live status">
              <p className="mt-1 text-sm text-zinc-500">Click a status to view matching employees.</p>
              <StatusPie data={attendanceChart} colors={firstChartColors} activeStatus={selectedStatus} hasSelection={selection !== null} onSelect={selectStatus} />
            </ChartCard>
            <ChartCard title="Punctuality">
              <p className="mt-1 text-sm text-zinc-500">Click a status to view matching employees.</p>
              <StatusPie data={punctualityChart} colors={secondChartColors} activeStatus={selectedStatus} hasSelection={selection !== null} onSelect={selectStatus} />
            </ChartCard>
          </div>
          <ChartCard
            title="Active employees over time"
            action={selection?.type === "interval" ? <button type="button" onClick={() => setSelection(null)} className="text-sm font-semibold text-red-700 hover:text-red-900">Clear selection</button> : undefined}
          >
            <p className="mb-3 text-sm text-zinc-500">Drag across the chart to select a time interval and view its attendance log.</p>
            <DashboardLineChart data={lineData} selection={selection} isDimmed={selection !== null && selection.type !== "interval"} onMouseDown={handleLineChartMouseDown} onMouseMove={handleLineChartMouseMove} onMouseUp={handleLineChartMouseUp} />
          </ChartCard>
        </div>
        <DashboardDetailsPanel date={date} selection={selection} selectedInterval={selectedInterval} selectedUsers={selectedUsers} intervalRecords={intervalRecords} />
      </div>
    </section>
  );
}

function DashboardHeader({
  date,
  onDateChange,
}: {
  date: string;
  onDateChange: (date: string) => void;
}) {
  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-600">Administration</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-red-950">Attendance dashboard</h1>
      </div>
      <label className="text-sm font-semibold text-zinc-700">
        Dashboard date
        <input type="date" value={date} onChange={(event) => onDateChange(event.target.value)} className="mt-2 block h-11 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-normal text-zinc-950 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100" />
      </label>
    </div>
  );
}

function makeChart(
  definitions: [string, string][],
  values: Status[],
): ChartStatus[] {
  return definitions.map(([status, name]) => ({
    status: status as Status,
    name,
    value: values.filter((value) => value === status).length,
  }));
}
