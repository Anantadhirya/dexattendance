"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DateRangePicker from "../date-range-picker";

type Employee = { id: string; name: string; email: string };
type Attendance = {
  id: string;
  userId: string;
  type: "check_in" | "check_out";
  timestamp: string;
  user: Employee;
};

const emptyForm = {
  userId: "",
  type: "check_in" as Attendance["type"],
  timestamp: "",
  notes: "",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
    hour12: false,
  }).format(new Date(value));
}

function toDateTimeLocal(value: string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export default function AttendancesPage() {
  const router = useRouter();
  const [records, setRecords] = useState<Attendance[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [pageInput, setPageInput] = useState("1");
  const [totalPages, setTotalPages] = useState(1);
  const [form, setForm] = useState(emptyForm);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

  function applyPageInput() {
    const requestedPage = Number(pageInput);
    if (
      Number.isInteger(requestedPage) &&
      requestedPage >= 1 &&
      requestedPage <= totalPages
    ) {
      setPage(requestedPage);
      setPageInput(String(requestedPage));
      return;
    }

    setPageInput(String(page));
  }

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [attendanceResponse, employeeResponse] = await Promise.all([
        fetch(
          `${apiUrl}/attendances?search=${encodeURIComponent(debouncedSearch)}&startDate=${encodeURIComponent(startDate ? new Date(`${startDate}T00:00:00`).toISOString() : "")}&endDate=${encodeURIComponent(endDate ? new Date(new Date(`${endDate}T00:00:00`).getTime() + 86400000).toISOString() : "")}&page=${page}&pageSize=10`,
          { credentials: "include" },
        ),
        fetch(`${apiUrl}/users?page=1&pageSize=100`, { credentials: "include" }),
      ]);
      const attendanceResult = await attendanceResponse.json();
      const employeeResult = await employeeResponse.json();
      if (!attendanceResponse.ok || !employeeResponse.ok) {
        throw new Error("Unable to load attendance data");
      }
      setRecords(attendanceResult.items);
      setTotalPages(attendanceResult.totalPages);
      setEmployees(employeeResult.items);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load attendance data",
      );
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl, debouncedSearch, endDate, page, startDate]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadData(), 0);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  function openCreateForm() {
    setForm({
      ...emptyForm,
      timestamp: toDateTimeLocal(new Date().toISOString()),
    });
    setError("");
    setIsFormOpen(true);
  }

  async function createAttendance(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSaving(true);
    try {
      const response = await fetch(`${apiUrl}/attendances`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...form,
          timestamp: new Date(form.timestamp).toISOString(),
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(
          Array.isArray(result.message)
            ? result.message.join(", ")
            : (result.message ?? "Unable to create attendance"),
        );
      }
      setIsFormOpen(false);
      await loadData();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to create attendance",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section>
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-600">
            Administration
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-red-950">
            Attendances
          </h1>
          <p className="mt-3 text-zinc-600">
            Review and manage employee attendance records.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateForm}
          className="rounded-xl bg-red-700 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-red-700/20 hover:bg-red-800"
        >
          Add attendance
        </button>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      <div className="mt-8 rounded-2xl border border-red-100 bg-white p-5 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[1.2fr_1fr]">
          <input
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
              setPageInput("1");
            }}
            placeholder="Search by employee name or email..."
            className="h-11 rounded-xl border border-zinc-200 bg-zinc-50 px-4 text-sm text-zinc-950 outline-none placeholder:text-zinc-500 focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-100"
          />
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onChange={(nextStartDate, nextEndDate) => {
              setStartDate(nextStartDate);
              setEndDate(nextEndDate);
              setPage(1);
              setPageInput("1");
            }}
          />
        </div>
        {isLoading ? (
          <p className="py-8 text-center text-sm text-zinc-500">
            Loading attendances...
          </p>
        ) : records.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-500">
            No attendance records found.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead className="border-b border-zinc-100 text-xs uppercase tracking-wide text-zinc-400">
                <tr>
                  <th className="px-3 py-3 font-semibold">Employee</th>
                  <th className="px-3 py-3 font-semibold">Type</th>
                  <th className="px-3 py-3 font-semibold">Date and time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {records.map((record) => (
                  <tr
                    key={record.id}
                    tabIndex={0}
                    role="link"
                    onClick={() =>
                      router.push(`/admin/attendances/${record.id}`)
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        router.push(`/admin/attendances/${record.id}`);
                      }
                    }}
                    className="cursor-pointer outline-none hover:bg-red-50 focus:bg-red-50"
                  >
                    <td className="px-3 py-4">
                      <p className="font-semibold text-zinc-950">
                        {record.user.name}
                      </p>
                      <p className="mt-1 text-zinc-600">{record.user.email}</p>
                    </td>
                    <td className="px-3 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          record.type === "check_in"
                            ? "bg-green-100 text-green-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {record.type === "check_in" ? "Check in" : "Check out"}
                      </span>
                    </td>
                    <td className="px-3 py-4 text-zinc-700">
                      {formatDate(record.timestamp)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {totalPages > 1 && (
          <div className="mt-5 flex items-center justify-between border-t border-zinc-100 pt-4 text-sm">
            <p className="text-zinc-500">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page === 1}
                onClick={() => {
                  const nextPage = page - 1;
                  setPage(nextPage);
                  setPageInput(String(nextPage));
                }}
                className="rounded-lg border border-zinc-200 px-3 py-2 text-zinc-700 disabled:opacity-40"
              >
                Previous
              </button>
              <input
                type="number"
                min={1}
                max={totalPages}
                value={pageInput}
                onChange={(event) => setPageInput(event.target.value)}
                onBlur={applyPageInput}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    applyPageInput();
                  }
                }}
                aria-label="Jump to page"
                className="h-10 w-16 rounded-lg border border-zinc-200 px-2 text-center text-zinc-700"
              />
              <button
                type="button"
                disabled={page === totalPages}
                onClick={() => {
                  const nextPage = page + 1;
                  setPage(nextPage);
                  setPageInput(String(nextPage));
                }}
                className="rounded-lg border border-zinc-200 px-3 py-2 text-zinc-700 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-red-950/30 p-5 backdrop-blur-sm">
          <form
            onSubmit={createAttendance}
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-red-950">
                  Add attendance
                </h2>
                <p className="mt-1 text-sm text-zinc-500">
                  Manual records have no image or location.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="text-2xl text-zinc-400 hover:text-zinc-700"
                aria-label="Close"
              >
                &times;
              </button>
            </div>
            <div className="mt-6 space-y-4">
              <select
                required
                value={form.userId}
                onChange={(event) =>
                  setForm({ ...form, userId: event.target.value })
                }
                className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm text-zinc-950 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100"
              >
                <option value="">Select employee</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name} ({employee.email})
                  </option>
                ))}
              </select>
              <select
                value={form.type}
                onChange={(event) =>
                  setForm({
                    ...form,
                    type: event.target.value as Attendance["type"],
                  })
                }
                className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm text-zinc-950 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100"
              >
                <option value="check_in">Check in</option>
                <option value="check_out">Check out</option>
              </select>
              <input
                required
                type="datetime-local"
                value={form.timestamp}
                onChange={(event) =>
                  setForm({ ...form, timestamp: event.target.value })
                }
                className="h-11 w-full rounded-xl border border-zinc-200 px-4 text-sm text-zinc-950 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100"
              />
              <textarea
                value={form.notes}
                onChange={(event) =>
                  setForm({ ...form, notes: event.target.value })
                }
                placeholder="Notes (optional)"
                rows={3}
                className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm text-zinc-950 outline-none placeholder:text-zinc-500 focus:border-red-500 focus:ring-4 focus:ring-red-100"
              />
            </div>
            <button
              disabled={isSaving}
              type="submit"
              className="mt-6 h-11 w-full rounded-xl bg-red-700 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-60"
            >
              {isSaving ? "Saving..." : "Save attendance"}
            </button>
          </form>
        </div>
      )}
    </section>
  );
}
