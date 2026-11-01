"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceLine,
  ReferenceArea,
  ResponsiveContainer,
  Sector,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import LoadingOverlay from "../../../../components/loading-overlay";

type User = {
  id: string;
  name: string;
  email: string;
  workSchedule: {
    name: string;
    startTime: string;
    endTime: string;
    lateThreshold: number;
  };
};

type Attendance = {
  id: string;
  userId: string;
  type: "check_in" | "check_out";
  timestamp: string;
  user: User;
};

type Status = "missing" | "checked_in" | "checked_out" | "late" | "on_time";
type Selection =
  | { type: "interval"; start: number; end: number }
  | { type: "status"; status: Status };

const firstChartColors = ["#ef4444", "#22c55e", "#3b82f6"];
const secondChartColors = ["#ef4444", "#fbbf24", "#22c55e"];

function localDateKey() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function currentLocalMinute() {
  const date = new Date();
  return date.getHours() * 60 + date.getMinutes();
}

function minutesOf(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function timeOf(timestamp: string) {
  const date = new Date(timestamp);
  return date.getHours() * 60 + date.getMinutes();
}

function formatTime(timestamp: string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(timestamp));
}

function formatScheduleDifference(actual: string, scheduled: string) {
  const difference = timeOf(actual) - minutesOf(scheduled);
  if (difference === 0) return "On time";
  if (difference > 0) return `${difference} minutes late`;
  return `${Math.abs(difference)} minutes early`;
}

function isBeyondLateThreshold(user: User, timestamp: string) {
  return (
    timeOf(timestamp) >
    minutesOf(user.workSchedule.startTime) + user.workSchedule.lateThreshold
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "long" }).format(
    new Date(`${value}T12:00:00`),
  );
}

function statusLabel(status: Status) {
  return status.replace("_", " ");
}

function formatMinute(minute: number) {
  if (minute >= 1440) return "23:59";
  return `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
}

function formatChartTime(minute: number) {
  if (minute >= 1440) return "24:00";
  return formatMinute(minute);
}

function statusFor(
  user: User,
  records: Attendance[],
): {
  attendance: "missing" | "checked_in" | "checked_out";
  punctuality: "missing" | "late" | "on_time";
  checkIn?: Attendance;
  checkOut?: Attendance;
} {
  const checkIn = records.find((record) => record.type === "check_in");
  const checkOut = [...records]
    .reverse()
    .find((record) => record.type === "check_out");
  if (!checkIn) {
    return { attendance: "missing", punctuality: "missing" };
  }
  const late =
    timeOf(checkIn.timestamp) >
    minutesOf(user.workSchedule.startTime) + user.workSchedule.lateThreshold;
  return {
    attendance: checkOut ? "checked_out" : "checked_in",
    punctuality: late ? "late" : "on_time",
    checkIn,
    checkOut,
  };
}

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

  const recordsByUser = useMemo(() => {
    const grouped = new Map<string, Attendance[]>();
    for (const attendance of attendances) {
      grouped.set(attendance.userId, [
        ...(grouped.get(attendance.userId) ?? []),
        attendance,
      ]);
    }
    return grouped;
  }, [attendances]);

  const userStatuses = useMemo(
    () =>
      users.map((user) => ({
        user,
        ...statusFor(user, recordsByUser.get(user.id) ?? []),
      })),
    [recordsByUser, users],
  );

  const attendanceChart = useMemo(
    () =>
      [
        ["missing", "Missing"],
        ["checked_in", "Checked in"],
        ["checked_out", "Checked out"],
      ].map(([status, name]) => ({
        status: status as Status,
        name,
        value: userStatuses.filter((item) => item.attendance === status).length,
      })),
    [userStatuses],
  );

  const punctualityChart = useMemo(
    () =>
      [
        ["missing", "Missing"],
        ["late", "Late"],
        ["on_time", "On time"],
      ].map(([status, name]) => ({
        status: status as Status,
        name,
        value: userStatuses.filter((item) => item.punctuality === status)
          .length,
      })),
    [userStatuses],
  );

  const lineData = useMemo(() => {
    return Array.from({ length: 145 }, (_, index) => {
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
    });
  }, [attendances, isToday, nowMinute, users]);

  const intervalRecords = useMemo(
    () =>
      attendances
        .filter((attendance) => {
          const minute = timeOf(attendance.timestamp);
          const interval =
            selection?.type === "interval"
              ? selection
              : { start: 0, end: nowMinute };
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

  function getChartMinute(event: {
    activeTooltipIndex?: number | string | null;
  }) {
    const index = Number(event.activeTooltipIndex);
    return Number.isInteger(index) && index >= 0 && index <= 144
      ? index * 10
      : null;
  }

  function handleLineChartMouseDown(event: {
    activeTooltipIndex?: number | string | null;
  }) {
    const minute = getChartMinute(event);
    if (minute !== null) {
      setDragStart(minute);
      setHasDragged(false);
      setSelection({ type: "interval", start: minute, end: minute });
    }
  }

  function handleLineChartMouseMove(event: {
    activeTooltipIndex?: number | string | null;
  }) {
    if (dragStart === null) return;
    const minute = getChartMinute(event);
    if (minute === null) return;

    if (minute !== dragStart) setHasDragged(true);
    setSelection({
      type: "interval",
      start: Math.min(dragStart, minute),
      end: Math.max(dragStart, minute),
    });
  }

  function handleLineChartMouseUp(event: {
    activeTooltipIndex?: number | string | null;
  }) {
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
  }

  const selectedStatus =
    selection?.type === "status" ? selection.status : undefined;
  const selectedInterval =
    selection?.type === "interval"
      ? selection
      : { start: 0, end: nowMinute };
  const isIntervalActive = selection?.type === "interval";

  return (
    <section>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-600">
            Administration
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-red-950">
            Attendance dashboard
          </h1>
        </div>
        <label className="text-sm font-semibold text-zinc-700">
          Dashboard date
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="mt-2 block h-11 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-normal text-zinc-950 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100"
          />
        </label>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      <div className="relative mt-8 grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        {isLoading && <LoadingOverlay label="Loading dashboard" />}
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <ChartCard title="Live status">
              <p className="mt-1 text-sm text-zinc-500">
                Click a status to view matching employees.
              </p>
              <StatusPie
                data={attendanceChart}
                colors={firstChartColors}
                activeStatus={selectedStatus}
                hasSelection={selection !== null}
                onSelect={(status) =>
                  setSelection((current) =>
                    current?.type === "status" && current.status === status
                      ? null
                      : { type: "status", status },
                  )
                }
              />
            </ChartCard>
            <ChartCard title="Punctuality">
              <p className="mt-1 text-sm text-zinc-500">
                Click a status to view matching employees.
              </p>
              <StatusPie
                data={punctualityChart}
                colors={secondChartColors}
                activeStatus={selectedStatus}
                hasSelection={selection !== null}
                onSelect={(status) =>
                  setSelection((current) =>
                    current?.type === "status" && current.status === status
                      ? null
                      : { type: "status", status },
                  )
                }
              />
            </ChartCard>
          </div>
          <ChartCard
            title="Active employees over time"
            action={
              selection?.type === "interval" ? (
                <button
                  type="button"
                  onClick={() => setSelection(null)}
                  className="text-sm font-semibold text-red-700 hover:text-red-900"
                >
                  Clear selection
                </button>
              ) : undefined
            }
          >
            <p className="mb-3 text-sm text-zinc-500">
              Drag across the chart to select a time interval and view its
              attendance log.
            </p>
            <div
              className={`select-none ${
                selection !== null && !isIntervalActive ? "opacity-40" : ""
              } outline-none [&_*:focus]:outline-none`}
              onDragStart={(event) => event.preventDefault()}
            >
              <ResponsiveContainer width="100%" height={280}>
                <LineChart
                  data={lineData}
                  margin={{ top: 10, right: 12, left: -20, bottom: 5 }}
                  onMouseDown={handleLineChartMouseDown}
                  onMouseMove={handleLineChartMouseMove}
                  onMouseUp={handleLineChartMouseUp}
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
          </ChartCard>
        </div>

        <section className="min-h-[28rem] rounded-3xl border border-red-100 bg-white p-6 shadow-sm flex flex-col">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-red-600">
            {selection?.type === "status"
              ? `${statusLabel(selection.status)} employees`
              : "Attendance log"}
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-red-950">
            {selection?.type === "status"
              ? formatDate(date)
              : `${formatMinute(selectedInterval.start)} – ${formatMinute(selectedInterval.end)}`}
          </h2>
          <div className="mt-6 max-xl:max-h-[34rem] xl:h-0 xl:grow space-y-3 overflow-y-auto">
            {selection?.type === "status"
              ? selectedUsers.map((item) => (
                  <Link
                    key={item.user.id}
                    href={`/admin/employees/${item.user.id}`}
                    className="block rounded-2xl bg-zinc-50 p-4 outline-none transition-colors hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-red-500"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-red-950">
                        {item.user.name}
                      </p>
                    </div>
                    {selection.status === "missing" ? (
                      <p className="mt-3 text-sm text-zinc-500">No check in</p>
                    ) : selection.status === "checked_out" ? (
                      <div className="mt-3 flex items-center gap-2 text-sm">
                        <span className="rounded-full bg-blue-100 px-3 py-1 font-semibold text-blue-700">
                          {item.checkOut
                            ? formatTime(item.checkOut.timestamp)
                            : "—"}
                        </span>
                        {item.checkOut && (
                          <span className="text-zinc-500">
                            {formatScheduleDifference(
                              item.checkOut.timestamp,
                              item.user.workSchedule.endTime,
                            )}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="mt-3 flex items-center gap-2 text-sm">
                        <span className="rounded-full bg-green-100 px-3 py-1 font-semibold text-green-700">
                          {item.checkIn
                            ? formatTime(item.checkIn.timestamp)
                            : "—"}
                        </span>
                        {item.checkIn && (
                          <span
                            className={
                              isBeyondLateThreshold(
                                item.user,
                                item.checkIn.timestamp,
                              )
                                ? "font-semibold text-yellow-600"
                                : "text-zinc-500"
                            }
                          >
                            {formatScheduleDifference(
                              item.checkIn.timestamp,
                              item.user.workSchedule.startTime,
                            )}
                          </span>
                        )}
                      </div>
                    )}
                  </Link>
                ))
              : intervalRecords.map((record) => (
                  <Link
                    key={record.id}
                    href={`/admin/attendances/${record.id}`}
                    className="block rounded-2xl bg-zinc-50 p-4 outline-none transition-colors hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-red-500"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-zinc-500">
                        {formatTime(record.timestamp)}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          record.type === "check_in"
                            ? "bg-green-100 text-green-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {record.type === "check_in" ? "Check in" : "Check out"}
                      </span>
                    </div>
                    <p className="mt-3 font-semibold text-red-950">
                      {record.user.name}
                    </p>
                  </Link>
                ))}
            {((selection?.type !== "status" && intervalRecords.length === 0) ||
              (selection?.type === "status" && selectedUsers.length === 0)) && (
              <p className="rounded-2xl bg-zinc-50 p-5 text-sm text-zinc-500">
                No attendance records match this selection.
              </p>
            )}
          </div>
        </section>
      </div>
    </section>
  );
}

function ChartCard({
  title,
  children,
  className = "",
  action,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <section
      className={`rounded-3xl border border-red-100 bg-white p-5 shadow-sm transition-opacity outline-none ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-red-950">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function StatusPie({
  data,
  colors,
  activeStatus,
  hasSelection,
  onSelect,
}: {
  data: { status: Status; name: string; value: number }[];
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
            <div className="flex items-center gap-1.5">
              <div
                className="h-2.5 w-2.5 rounded-full aspect-square shrink-0"
                style={{ backgroundColor: colors[index] }}
              />
              {entry.name}:
            </div>
            <div>{entry.value}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
