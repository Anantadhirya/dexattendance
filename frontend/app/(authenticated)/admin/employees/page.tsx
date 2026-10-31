"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { FiEdit2, FiTrash2 } from "react-icons/fi";

type Schedule = {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  lateThreshold: number;
};

type Employee = {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  isActive: boolean;
  workScheduleId: string | null;
  workSchedule: { id: string; name: string } | null;
};

type FormState = {
  name: string;
  email: string;
  password: string;
  isActive: boolean;
  isAdmin: boolean;
  workScheduleId: string;
};

const emptyForm: FormState = {
  name: "",
  email: "",
  password: "",
  isActive: false,
  isAdmin: false,
  workScheduleId: "",
};

function Toggle({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4 text-sm text-zinc-700">
      <span>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition ${
          checked ? "bg-red-700" : "bg-zinc-300"
        }`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${
            checked ? "left-6" : "left-1"
          }`}
        />
      </button>
    </label>
  );
}

export default function EmployeesPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageInput, setPageInput] = useState("1");
  const [totalPages, setTotalPages] = useState(1);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
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

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [employeesResponse, schedulesResponse] = await Promise.all([
        fetch(
          `${apiUrl}/users?search=${encodeURIComponent(debouncedSearch)}&page=${page}&pageSize=10`,
          { credentials: "include" },
        ),
        fetch(`${apiUrl}/work-schedules`, { credentials: "include" }),
      ]);

      if (!employeesResponse.ok || !schedulesResponse.ok) {
        throw new Error("Unable to load employee data");
      }

      const employeeResult = await employeesResponse.json();
      setEmployees(employeeResult.items);
      setTotalPages(employeeResult.totalPages);
      setSchedules(await schedulesResponse.json());
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load employee data",
      );
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl, debouncedSearch, page]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadData(), 0);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  function openCreateForm() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setIsFormOpen(true);
  }

  function openEditForm(employee: Employee) {
    setEditingId(employee.id);
    setForm({
      name: employee.name,
      email: employee.email,
      password: "",
      isActive: employee.isActive,
      isAdmin: employee.isAdmin,
      workScheduleId: employee.workScheduleId ?? "",
    });
    setError("");
    setIsFormOpen(true);
  }

  async function saveEmployee(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSaving(true);

    const body = {
      name: form.name,
      email: form.email,
      ...(editingId ? {} : { password: form.password }),
      ...(editingId && form.password ? { password: form.password } : {}),
      isActive: form.isActive,
      ...(editingId ? { isAdmin: form.isAdmin } : {}),
      workScheduleId: form.workScheduleId || null,
    };

    try {
      const response = await fetch(
        `${apiUrl}/users${editingId ? `/${editingId}` : ""}`,
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(body),
        },
      );
      const result = await response.json();
      if (!response.ok) {
        throw new Error(
          Array.isArray(result.message)
            ? result.message.join(", ")
            : result.message ?? "Unable to save employee",
        );
      }

      setIsFormOpen(false);
      await loadData();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to save employee",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteEmployee(employee: Employee) {
    if (
      !window.confirm(
        `Delete ${employee.name}? This cannot be undone.`,
      )
    ) {
      return;
    }

    setError("");
    try {
      const response = await fetch(`${apiUrl}/users/${employee.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message ?? "Unable to delete employee");
      }
      setEmployees((current) =>
        current.filter((item) => item.id !== employee.id),
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to delete employee",
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
            Employees
          </h1>
          <p className="mt-3 text-zinc-600">
            Manage employee access and work schedules.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateForm}
          className="rounded-xl bg-red-700 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-red-700/20 hover:bg-red-800"
        >
          Add employee
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-8 rounded-2xl border border-red-100 bg-white p-5 shadow-sm">
        <input
          type="search"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
            setPageInput("1");
          }}
          placeholder="Search by name or email..."
          className="h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 text-sm text-zinc-950 outline-none placeholder:text-zinc-500 focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-100"
        />
        <div className="mt-5 overflow-x-auto">
          {isLoading ? (
            <p className="py-8 text-center text-sm text-zinc-500">Loading employees...</p>
          ) : employees.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-500">No employees found.</p>
          ) : (
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="border-b border-zinc-100 text-xs uppercase tracking-wide text-zinc-400">
                <tr>
                  <th className="px-3 py-3 font-semibold">Employee</th>
                  <th className="px-3 py-3 font-semibold">Status</th>
                  <th className="px-3 py-3 font-semibold">Role</th>
                  <th className="px-3 py-3 font-semibold">Schedule</th>
                  <th className="px-3 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {employees.map((employee) => (
                  <tr
                    key={employee.id}
                    tabIndex={0}
                    role="link"
                    onClick={() => router.push(`/admin/employees/${employee.id}`)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        router.push(`/admin/employees/${employee.id}`);
                      }
                    }}
                    className="cursor-pointer outline-none hover:bg-red-50 focus:bg-red-50"
                  >
                    <td className="px-3 py-4">
                      <p className="font-semibold text-zinc-950">
                        {employee.name}
                      </p>
                      <p className="mt-1 text-zinc-700">{employee.email}</p>
                    </td>
                    <td className="px-3 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${employee.isActive ? "bg-green-50 text-green-700" : "bg-zinc-100 text-zinc-500"}`}>
                        {employee.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-3 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          employee.isAdmin
                            ? "bg-red-50 text-red-700"
                            : "bg-zinc-100 text-zinc-600"
                        }`}
                      >
                        {employee.isAdmin ? "Administrator" : "Employee"}
                      </span>
                    </td>
                    <td className="px-3 py-4">
                      {employee.workSchedule ? (
                        <span className="text-zinc-600">
                          {employee.workSchedule.name}
                        </span>
                      ) : (
                        <span className="italic text-zinc-400">
                          Not assigned
                        </span>
                      )}
                    </td>
                    <td
                      className="px-3 py-4 text-right"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => openEditForm(employee)}
                        aria-label={`Edit ${employee.name}`}
                        title="Edit employee"
                        className="rounded-lg p-2 text-red-700 hover:bg-red-50 hover:text-red-900"
                      >
                        <FiEdit2 aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteEmployee(employee)}
                        aria-label={`Delete ${employee.name}`}
                        title="Delete employee"
                        className="ml-2 rounded-lg p-2 text-zinc-500 hover:bg-red-50 hover:text-red-700"
                      >
                        <FiTrash2 aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
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
          <form onSubmit={saveEmployee} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-red-950">
                  {editingId ? "Edit employee" : "Add employee"}
                </h2>
                <p className="mt-1 text-sm text-zinc-500">
                  {editingId ? "Update employee access and schedule." : "Set access and schedule for the new employee."}
                </p>
              </div>
              <button type="button" onClick={() => setIsFormOpen(false)} className="text-2xl text-zinc-400 hover:text-zinc-700" aria-label="Close">
                &times;
              </button>
            </div>
            <div className="mt-6 space-y-4">
              <input required minLength={2} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Full name" className="h-11 w-full rounded-xl border border-zinc-200 px-4 text-sm text-zinc-950 outline-none placeholder:text-zinc-500 focus:border-red-500 focus:ring-4 focus:ring-red-100" />
              <input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="Email address" className="h-11 w-full rounded-xl border border-zinc-200 px-4 text-sm text-zinc-950 outline-none placeholder:text-zinc-500 focus:border-red-500 focus:ring-4 focus:ring-red-100" />
              <input required={!editingId} minLength={8} type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder={editingId ? "New password (optional)" : "Temporary password"} className="h-11 w-full rounded-xl border border-zinc-200 px-4 text-sm text-zinc-950 outline-none placeholder:text-zinc-500 focus:border-red-500 focus:ring-4 focus:ring-red-100" />
              <select value={form.workScheduleId} onChange={(event) => setForm({ ...form, workScheduleId: event.target.value })} className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm text-zinc-950 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100">
                <option value="" className="text-zinc-700">No work schedule</option>
                {schedules.map((schedule) => <option key={schedule.id} value={schedule.id}>{schedule.name}</option>)}
              </select>
              <div className="space-y-3 rounded-xl bg-zinc-50 p-4">
                <Toggle
                  checked={form.isActive}
                  label="Active account"
                  onChange={(isActive) => setForm({ ...form, isActive })}
                />
                {editingId && (
                  <Toggle
                    checked={form.isAdmin}
                    label="Administrator access"
                    onChange={(isAdmin) => setForm({ ...form, isAdmin })}
                  />
                )}
              </div>
            </div>
            <button disabled={isSaving} type="submit" className="mt-6 h-11 w-full rounded-xl bg-red-700 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-60">
              {isSaving ? "Saving..." : "Save employee"}
            </button>
          </form>
        </div>
      )}
    </section>
  );
}
