"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { FiArrowLeft, FiSave, FiTrash2 } from "react-icons/fi";
import { useParams, useRouter } from "next/navigation";
import ConfirmationDialog from "../../../../../components/confirmation-dialog";

type Employee = { id: string; name: string; email: string };
type Attendance = {
  id: string;
  userId: string;
  type: "check_in" | "check_out";
  timestamp: string;
  imageUrl: string | null;
  latitude: string | null;
  longitude: string | null;
  notes: string | null;
  user: Employee;
};

function toDateTimeLocal(value: string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export default function AttendanceDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [record, setRecord] = useState<Attendance | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [form, setForm] = useState({
    userId: "",
    type: "check_in" as Attendance["type"],
    timestamp: "",
    notes: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [recordResponse, employeeResponse] = await Promise.all([
        fetch(`${apiUrl}/attendances/${params.id}`, { credentials: "include" }),
        fetch(`${apiUrl}/users`, { credentials: "include" }),
      ]);
      const recordResult = await recordResponse.json();
      const employeeResult = await employeeResponse.json();
      if (!recordResponse.ok || !employeeResponse.ok) {
        throw new Error(recordResult.message ?? "Unable to load attendance");
      }
      setRecord(recordResult);
      setEmployees(employeeResult.items);
      setForm({
        userId: recordResult.userId,
        type: recordResult.type,
        timestamp: toDateTimeLocal(recordResult.timestamp),
        notes: recordResult.notes ?? "",
      });
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load attendance",
      );
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl, params.id]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadData(), 0);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  const mapUrl = useMemo(() => {
    if (!record?.latitude || !record.longitude) return null;
    const latitude = Number(record.latitude);
    const longitude = Number(record.longitude);
    const delta = 0.01;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${longitude - delta}%2C${latitude - delta}%2C${longitude + delta}%2C${latitude + delta}&layer=mapnik&marker=${latitude}%2C${longitude}`;
  }, [record]);

  async function saveAttendance(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!record) return;
    setError("");
    setIsSaving(true);
    try {
      const response = await fetch(`${apiUrl}/attendances/${record.id}`, {
        method: "PATCH",
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
            : result.message ?? "Unable to save attendance",
        );
      }
      setRecord(result);
      setForm({
        userId: result.userId,
        type: result.type,
        timestamp: toDateTimeLocal(result.timestamp),
        notes: result.notes ?? "",
      });
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to save attendance",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteAttendance() {
    if (!record) return;
    setError("");
    try {
      const response = await fetch(`${apiUrl}/attendances/${record.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message ?? "Unable to delete attendance");
      setIsDeleteDialogOpen(false);
      router.replace("/admin/attendances");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to delete attendance",
      );
    }
  }

  if (isLoading) {
    return <p className="py-8 text-center text-sm text-zinc-500">Loading attendance...</p>;
  }

  if (!record) {
    return (
      <section>
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error || "Attendance record not found"}
        </p>
        <button
          type="button"
          onClick={() => router.replace("/admin/attendances")}
          className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-red-700"
        >
          <FiArrowLeft aria-hidden="true" /> Back to attendances
        </button>
      </section>
    );
  }

  return (
    <section>
      <button
        type="button"
        onClick={() => router.push("/admin/attendances")}
        className="inline-flex items-center gap-2 text-sm font-semibold text-red-700 hover:text-red-900"
      >
        <FiArrowLeft aria-hidden="true" /> Back to attendances
      </button>
      <div className="mt-5 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-600">
            Attendance details
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-red-950">
            {record.user.name}
          </h1>
          <p className="mt-3 text-zinc-600">{record.user.email}</p>
        </div>
        <button
          type="button"
          onClick={() => setIsDeleteDialogOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 px-5 py-3 text-sm font-semibold text-red-700 hover:bg-red-50"
        >
          <FiTrash2 aria-hidden="true" /> Delete
        </button>
      </div>
      {isDeleteDialogOpen && (
        <ConfirmationDialog
          title="Delete attendance record?"
          message="Delete this attendance record? This cannot be undone."
          confirmLabel="Delete"
          onCancel={() => setIsDeleteDialogOpen(false)}
          onConfirm={() => void deleteAttendance()}
        />
      )}

      {error && (
        <p role="alert" className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <form
          onSubmit={saveAttendance}
          className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm"
        >
          <h2 className="text-xl font-semibold text-red-950">Edit record</h2>
          <div className="mt-5 space-y-4">
            <select
              value={form.userId}
              onChange={(event) => setForm({ ...form, userId: event.target.value })}
              className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm text-zinc-950 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100"
            >
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name} ({employee.email})
                </option>
              ))}
            </select>
            <select
              value={form.type}
              onChange={(event) =>
                setForm({ ...form, type: event.target.value as Attendance["type"] })
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
              onChange={(event) => setForm({ ...form, timestamp: event.target.value })}
              className="h-11 w-full rounded-xl border border-zinc-200 px-4 text-sm text-zinc-950 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100"
            />
            <textarea
              value={form.notes}
              onChange={(event) => setForm({ ...form, notes: event.target.value })}
              placeholder="Notes"
              rows={4}
              className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm text-zinc-950 outline-none placeholder:text-zinc-500 focus:border-red-500 focus:ring-4 focus:ring-red-100"
            />
          </div>
          <button
            disabled={isSaving}
            type="submit"
            className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-red-700 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-60"
          >
            <FiSave aria-hidden="true" /> {isSaving ? "Saving..." : "Save"}
          </button>
        </form>

        <div className="space-y-6">
          <div className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold text-red-950">Image</h2>
            {record.imageUrl ? (
              <img
                src={record.imageUrl}
                alt={`Attendance capture for ${record.user.name}`}
                className="mt-4 max-h-80 w-full rounded-xl object-contain"
              />
            ) : (
              <p className="mt-4 italic text-zinc-400">No image available</p>
            )}
          </div>
          <div className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold text-red-950">Location</h2>
            {mapUrl ? (
              <iframe
                title="Attendance location"
                src={mapUrl}
                className="mt-4 h-72 w-full rounded-xl border-0"
                loading="lazy"
              />
            ) : (
              <p className="mt-4 italic text-zinc-400">No location available</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
