"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { FiArrowLeft } from "react-icons/fi";
import AttendanceHistory from "../../../attendance-history";

type Employee = { id: string; name: string; email: string };

export default function EmployeeAttendancePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [error, setError] = useState("");
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

  const loadData = useCallback(async () => {
    const { id } = await params;
    try {
      const employeeResponse = await fetch(`${apiUrl}/users/${id}`, {
        credentials: "include",
      });
      const employeeResult = await employeeResponse.json();
      if (!employeeResponse.ok) {
        throw new Error(
          employeeResult.message ?? "Unable to load employee attendance",
        );
      }
      setEmployee(employeeResult);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load employee attendance",
      );
    }
  }, [apiUrl, params]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadData(), 0);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  if (error) {
    return (
      <p
        role="alert"
        className="mx-auto mt-10 max-w-6xl rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
      >
        {error}
      </p>
    );
  }

  if (!employee) {
    return (
      <p className="mx-auto mt-10 max-w-6xl text-sm text-zinc-500">
        Loading attendance...
      </p>
    );
  }

  return (
    <>
      <div className="mx-auto w-full max-w-6xl">
        <Link
          href="/admin/employees"
          className="inline-flex items-center gap-2 text-sm font-semibold text-red-700 hover:text-red-900"
        >
          <FiArrowLeft aria-hidden="true" />
          Back to employees
        </Link>
        <p className="mt-5 text-sm font-semibold uppercase tracking-[0.2em] text-red-600">
          Employee details
        </p>
      </div>
      <AttendanceHistory
        endpoint={`${apiUrl}/attendances/user/${employee.id}`}
        title="Employee attendance"
        employeeName={employee.name}
        subtitle={employee.email}
      />
    </>
  );
}
