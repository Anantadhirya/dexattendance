import Link from "next/link";
import type { Attendance, Selection, UserStatus } from "./types";
import {
  formatDate,
  formatMinute,
  formatScheduleDifference,
  formatTime,
  isBeyondLateThreshold,
  statusLabel,
} from "./utils";

export default function DashboardDetailsPanel({
  date,
  selection,
  selectedInterval,
  selectedUsers,
  intervalRecords,
}: {
  date: string;
  selection: Selection | null;
  selectedInterval: { start: number; end: number };
  selectedUsers: UserStatus[];
  intervalRecords: Attendance[];
}) {
  const isEmpty =
    selection?.type === "status"
      ? selectedUsers.length === 0
      : intervalRecords.length === 0;

  return (
    <section className="flex min-h-[28rem] flex-col rounded-3xl border border-red-100 bg-white p-6 shadow-sm">
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
              <StatusEmployee key={item.user.id} item={item} selection={selection} />
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
        {isEmpty && (
          <p className="rounded-2xl bg-zinc-50 p-5 text-sm text-zinc-500">
            No attendance records match this selection.
          </p>
        )}
      </div>
    </section>
  );
}

function StatusEmployee({
  item,
  selection,
}: {
  item: UserStatus;
  selection: Extract<Selection, { type: "status" }>;
}) {
  return (
    <Link
      href={`/admin/employees/${item.user.id}`}
      className="block rounded-2xl bg-zinc-50 p-4 outline-none transition-colors hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-red-500"
    >
      <p className="font-semibold text-red-950">{item.user.name}</p>
      {selection.status === "missing" ? (
        <p className="mt-3 text-sm text-zinc-500">No check in</p>
      ) : selection.status === "checked_out" ? (
        <div className="mt-3 flex items-center gap-2 text-sm">
          <span className="rounded-full bg-blue-100 px-3 py-1 font-semibold text-blue-700">
            {item.checkOut ? formatTime(item.checkOut.timestamp) : "—"}
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
            {item.checkIn ? formatTime(item.checkIn.timestamp) : "—"}
          </span>
          {item.checkIn && (
            <span
              className={
                isBeyondLateThreshold(item.user, item.checkIn.timestamp)
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
  );
}
