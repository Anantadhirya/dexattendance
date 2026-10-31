"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import ConfirmationDialog from "../../../../components/confirmation-dialog";

type Schedule = {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  lateThreshold: number;
};

type FormState = Omit<Schedule, "id">;

const emptyForm: FormState = {
  name: "",
  startTime: "09:00",
  endTime: "17:00",
  lateThreshold: 15,
};

function formatTime(time: string) {
  return time.slice(0, 5);
}

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState<Schedule | null>(null);
  const [error, setError] = useState("");

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

  const loadSchedules = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${apiUrl}/work-schedules`, {
        credentials: "include",
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message ?? "Unable to load work schedules");
      }
      setSchedules(result);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load work schedules",
      );
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadSchedules(), 0);
    return () => window.clearTimeout(timer);
  }, [loadSchedules]);

  function openCreateForm() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setIsFormOpen(true);
  }

  function openEditForm(schedule: Schedule) {
    setEditingId(schedule.id);
    setForm({
      name: schedule.name,
      startTime: formatTime(schedule.startTime),
      endTime: formatTime(schedule.endTime),
      lateThreshold: schedule.lateThreshold,
    });
    setError("");
    setIsFormOpen(true);
  }

  async function saveSchedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSaving(true);

    try {
      const response = await fetch(
        `${apiUrl}/work-schedules${editingId ? `/${editingId}` : ""}`,
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            ...form,
            lateThreshold: Number(form.lateThreshold),
          }),
        },
      );
      const result = await response.json();
      if (!response.ok) {
        throw new Error(
          Array.isArray(result.message)
            ? result.message.join(", ")
            : result.message ?? "Unable to save work schedule",
        );
      }

      setIsFormOpen(false);
      await loadSchedules();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to save work schedule",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteSchedule(schedule: Schedule) {
    setError("");
    try {
      const response = await fetch(`${apiUrl}/work-schedules/${schedule.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message ?? "Unable to delete work schedule");
      }
      setSchedules((current) =>
        current.filter((item) => item.id !== schedule.id),
      );
      setScheduleToDelete(null);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to delete work schedule",
      );
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
            Schedules
          </h1>
          <p className="mt-3 text-zinc-600">
            Define working hours and late-arrival thresholds.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateForm}
          className="rounded-xl bg-red-700 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-red-700/20 hover:bg-red-800"
        >
          Add schedule
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-8 rounded-2xl border border-red-100 bg-white p-5 shadow-sm">
        {isLoading ? (
          <p className="py-8 text-center text-sm text-zinc-500">
            Loading schedules...
          </p>
        ) : schedules.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-500">
            No work schedules found.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead className="border-b border-zinc-100 text-xs uppercase tracking-wide text-zinc-400">
                <tr>
                  <th className="px-3 py-3 font-semibold">Schedule</th>
                  <th className="px-3 py-3 font-semibold">Working hours</th>
                  <th className="px-3 py-3 font-semibold">Late threshold</th>
                  <th className="px-3 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {schedules.map((schedule) => (
                  <tr key={schedule.id}>
                    <td className="px-3 py-4 font-semibold text-zinc-950">
                      {schedule.name}
                    </td>
                    <td className="px-3 py-4 text-zinc-700">
                      {formatTime(schedule.startTime)} -{" "}
                      {formatTime(schedule.endTime)}
                    </td>
                    <td className="px-3 py-4 text-zinc-700">
                      {schedule.lateThreshold} minutes
                    </td>
                    <td className="px-3 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => openEditForm(schedule)}
                        aria-label={`Edit ${schedule.name}`}
                        title="Edit schedule"
                        className="rounded-lg p-2 text-red-700 hover:bg-red-50 hover:text-red-900"
                      >
                        <FiEdit2 aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setScheduleToDelete(schedule)}
                        aria-label={`Delete ${schedule.name}`}
                        title="Delete schedule"
                        className="ml-2 rounded-lg p-2 text-zinc-500 hover:bg-red-50 hover:text-red-700"
                      >
                        <FiTrash2 aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-red-950/30 p-5 backdrop-blur-sm">
          <form
            onSubmit={saveSchedule}
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-red-950">
                  {editingId ? "Edit schedule" : "Add schedule"}
                </h2>
                <p className="mt-1 text-sm text-zinc-500">
                  Set working hours and the late-arrival allowance.
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
              <input
                required
                minLength={2}
                value={form.name}
                onChange={(event) =>
                  setForm({ ...form, name: event.target.value })
                }
                placeholder="Schedule name"
                className="h-11 w-full rounded-xl border border-zinc-200 px-4 text-sm text-zinc-950 outline-none placeholder:text-zinc-500 focus:border-red-500 focus:ring-4 focus:ring-red-100"
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-medium text-zinc-700">
                  Start time
                  <input
                    required
                    type="time"
                    value={form.startTime}
                    onChange={(event) =>
                      setForm({ ...form, startTime: event.target.value })
                    }
                    className="mt-2 h-11 w-full rounded-xl border border-zinc-200 px-4 text-sm text-zinc-950 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100"
                  />
                </label>
                <label className="text-sm font-medium text-zinc-700">
                  End time
                  <input
                    required
                    type="time"
                    value={form.endTime}
                    onChange={(event) =>
                      setForm({ ...form, endTime: event.target.value })
                    }
                    className="mt-2 h-11 w-full rounded-xl border border-zinc-200 px-4 text-sm text-zinc-950 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100"
                  />
                </label>
              </div>
              <label className="block text-sm font-medium text-zinc-700">
                Late threshold (minutes)
                <input
                  required
                  min={0}
                  max={1440}
                  type="number"
                  value={form.lateThreshold}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      lateThreshold: Number(event.target.value),
                    })
                  }
                  className="mt-2 h-11 w-full rounded-xl border border-zinc-200 px-4 text-sm text-zinc-950 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100"
                />
              </label>
            </div>
            <button
              disabled={isSaving}
              type="submit"
              className="mt-6 h-11 w-full rounded-xl bg-red-700 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-60"
            >
              {isSaving ? "Saving..." : "Save schedule"}
            </button>
          </form>
        </div>
      )}
      {scheduleToDelete && (
        <ConfirmationDialog
          title="Delete work schedule?"
          message={`Delete ${scheduleToDelete.name}? Employees assigned to it will become unassigned.`}
          confirmLabel="Delete"
          onCancel={() => setScheduleToDelete(null)}
          onConfirm={() => void deleteSchedule(scheduleToDelete)}
        />
      )}
    </section>
  );
}
