"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FiChevronLeft, FiChevronRight, FiClock } from "react-icons/fi";

export type AttendanceHistoryRecord = {
  id: string;
  type: "check_in" | "check_out";
  timestamp: string;
  notes: string | null;
  user: {
    workSchedule: {
      startTime: string;
      endTime: string;
      lateThreshold: number;
    } | null;
  };
};

type AttendanceStatus = "incomplete" | "late" | "left early" | "on time";

type AttendanceHistoryProps = {
  endpoint: string;
  title: string;
  subtitle?: string;
  employeeName?: string;
  className?: string;
};

const statusStyles: Record<AttendanceStatus, string> = {
  incomplete: "bg-red-100 text-red-800",
  late: "bg-amber-200 text-amber-900",
  "left early": "bg-amber-200 text-amber-900",
  "on time": "bg-green-100 text-green-800",
};

function dateKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

function timeInMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function getStatus(
  records: AttendanceHistoryRecord[],
): AttendanceStatus | null {
  if (records.length === 0) return null;

  const checkIn = records.find((record) => record.type === "check_in");
  const checkOut = [...records]
    .reverse()
    .find((record) => record.type === "check_out");

  if (!checkIn || !checkOut) return "incomplete";

  const schedule = checkIn.user.workSchedule;
  if (schedule) {
    const checkInDate = new Date(checkIn.timestamp);
    const checkOutDate = new Date(checkOut.timestamp);
    const checkInMinutes =
      checkInDate.getHours() * 60 + checkInDate.getMinutes();
    const checkOutMinutes =
      checkOutDate.getHours() * 60 + checkOutDate.getMinutes();

    if (
      checkInMinutes >
      timeInMinutes(schedule.startTime) + schedule.lateThreshold
    ) {
      return "late";
    }

    if (checkOutMinutes < timeInMinutes(schedule.endTime)) {
      return "left early";
    }
  }

  return "on time";
}

export default function AttendanceHistory({
  endpoint,
  title,
  subtitle,
  employeeName,
  className = "",
}: AttendanceHistoryProps) {
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [records, setRecords] = useState<AttendanceHistoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const days = useMemo(() => {
    const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
    const gridStart = new Date(firstDay);
    gridStart.setDate(firstDay.getDate() - firstDay.getDay());
    return Array.from({ length: 42 }, (_, index) => {
      const day = new Date(gridStart);
      day.setDate(gridStart.getDate() + index);
      return day;
    });
  }, [month]);

  const loadRecords = useCallback(async () => {
    setIsLoading(true);
    const startDate = new Date(days[0]);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(days[days.length - 1]);
    endDate.setHours(23, 59, 59, 999);
    try {
      const query = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });
      const response = await fetch(`${endpoint}?${query}`, {
        credentials: "include",
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.message ?? "Unable to load attendance");
      setRecords(result);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load attendance",
      );
    } finally {
      setIsLoading(false);
    }
  }, [days, endpoint]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadRecords(), 0);
    return () => window.clearTimeout(timer);
  }, [loadRecords]);

  const recordsByDay = useMemo(() => {
    const grouped = new Map<string, AttendanceHistoryRecord[]>();
    for (const record of records) {
      const key = dateKey(new Date(record.timestamp));
      grouped.set(key, [...(grouped.get(key) ?? []), record]);
    }
    return grouped;
  }, [records]);

  const monthStatuses = days
    .filter((day) => day.getMonth() === month.getMonth())
    .map((day) => getStatus(recordsByDay.get(dateKey(day)) ?? []))
    .filter((status): status is AttendanceStatus => status !== null);
  const selectedRecords = selectedDate
    ? (recordsByDay.get(selectedDate) ?? [])
    : [];
  const selectedStatus = getStatus(selectedRecords);

  function changeMonth(offset: number) {
    setSelectedDate(null);
    setMonth(
      (current) =>
        new Date(current.getFullYear(), current.getMonth() + offset, 1),
    );
  }

  return (
    <main className={`mx-auto w-full max-w-6xl ${className}`}>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight text-red-950">
        {title}
      </h1>
      {employeeName && (
        <p className="mt-2 text-lg font-medium text-zinc-700">{employeeName}</p>
      )}
      {subtitle && <p className="mt-3 text-zinc-600">{subtitle}</p>}
      {error && (
        <p
          role="alert"
          className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
        <section className="relative rounded-3xl border border-red-100 bg-white p-5 shadow-sm sm:p-7">
          {isLoading && (
            <div
              className="absolute inset-0 z-10 flex items-center justify-center rounded-3xl bg-white/70"
              role="status"
              aria-label="Loading attendance"
            >
              <span className="h-10 w-10 animate-spin rounded-full border-4 border-red-100 border-t-red-700" />
            </div>
          )}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => changeMonth(-1)}
              aria-label="Previous month"
              className="rounded-lg p-2 text-zinc-500 hover:bg-red-50 hover:text-red-700"
            >
              <FiChevronLeft aria-hidden="true" />
            </button>
            <h2 className="text-lg font-semibold text-red-950">
              {new Intl.DateTimeFormat(undefined, {
                month: "long",
                year: "numeric",
              }).format(month)}
            </h2>
            <button
              type="button"
              onClick={() => changeMonth(1)}
              aria-label="Next month"
              className="rounded-lg p-2 text-zinc-500 hover:bg-red-50 hover:text-red-700"
            >
              <FiChevronRight aria-hidden="true" />
            </button>
          </div>
          <div className="mt-6 grid grid-cols-7 text-center text-xs font-semibold uppercase tracking-wide text-zinc-400">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <span key={day} className="py-2">
                {day}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const key = dateKey(day);
              const status = getStatus(recordsByDay.get(key) ?? []);
              const isSelected = key === selectedDate;
              return (
                <button
                  type="button"
                  key={key}
                  disabled={day.getMonth() !== month.getMonth()}
                  onClick={() => setSelectedDate(isSelected ? null : key)}
                  className={`flex min-h-20 flex-col items-center justify-center rounded-xl p-2 text-center transition ${
                    day.getMonth() !== month.getMonth()
                      ? "cursor-not-allowed text-zinc-400"
                      : status
                        ? statusStyles[status]
                        : "bg-zinc-50 text-zinc-700"
                  } ${
                    isSelected
                      ? "ring-2 ring-red-500 ring-offset-2"
                      : day.getMonth() === month.getMonth()
                        ? "hover:brightness-95"
                        : ""
                  }`}
                >
                  <span className="text-sm font-semibold">{day.getDate()}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-3xl border border-red-100 bg-white p-6 shadow-sm">
          {selectedDate ? (
            <>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-red-600">
                Selected day
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-red-950">
                {new Intl.DateTimeFormat(undefined, {
                  dateStyle: "long",
                }).format(new Date(`${selectedDate}T12:00:00`))}
              </h2>
              {selectedStatus ? (
                <span
                  className={`mt-5 inline-block rounded-full px-3 py-1 text-sm font-semibold capitalize ${statusStyles[selectedStatus]}`}
                >
                  {selectedStatus}
                </span>
              ) : (
                <span className="mt-5 inline-block rounded-full bg-white px-3 py-1 text-sm font-semibold text-zinc-500 ring-1 ring-zinc-200">
                  No attendance
                </span>
              )}
              <div className="mt-6 space-y-3">
                {(["check_in", "check_out"] as const).map((type) => {
                  const record = selectedRecords.find(
                    (item) => item.type === type,
                  );
                  return (
                    <div
                      key={type}
                      className="flex items-center justify-between rounded-2xl bg-zinc-50 p-4"
                    >
                      <span className="font-medium text-zinc-700">
                        {type === "check_in" ? "Check in" : "Check out"}
                      </span>
                      <span className="flex items-center gap-2 font-semibold text-red-950">
                        <FiClock aria-hidden="true" />
                        {record ? formatTime(record.timestamp) : "--:--"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-red-600">
                Monthly summary
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-red-950">
                {new Intl.DateTimeFormat(undefined, {
                  month: "long",
                  year: "numeric",
                }).format(month)}
              </h2>
              <div className="mt-6 space-y-3">
                {(["on time", "late", "left early", "incomplete"] as const).map(
                  (status) => (
                    <div
                      key={status}
                      className={`flex items-center justify-between rounded-2xl p-4 ${statusStyles[status]}`}
                    >
                      <span className="text-sm font-semibold capitalize">
                        {status}
                      </span>
                      <span className="text-xl font-semibold">
                        {monthStatuses.filter((item) => item === status).length}
                      </span>
                    </div>
                  ),
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
