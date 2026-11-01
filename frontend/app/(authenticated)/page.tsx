"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FiCamera, FiCheckCircle, FiClock, FiMapPin } from "react-icons/fi";
import CameraDialog from "../../components/camera-dialog";
import ConfirmationDialog from "../../components/confirmation-dialog";
import LoadingOverlay from "../../components/loading-overlay";
import { useUser } from "./user-provider";

type Attendance = {
  id: string;
  type: "check_in" | "check_out";
  timestamp: string;
  imageUrl: string | null;
  latitude: string | null;
  longitude: string | null;
};

function formatTime(value?: string) {
  return value
    ? new Intl.DateTimeFormat(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(new Date(value))
    : "--:--";
}

function getLocation(): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Location is not supported by this browser"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
      () => reject(new Error("Location permission is required to continue")),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  });
}

async function uploadToCloudinary(file: File) {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error(
      "Cloudinary is not configured. Add the cloud name and upload preset.",
    );
  }

  const body = new FormData();
  body.append("file", file);
  body.append("upload_preset", uploadPreset);
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body },
  );
  const result = await response.json();

  if (!response.ok || typeof result.secure_url !== "string") {
    throw new Error("Unable to upload the attendance image");
  }

  return result.secure_url as string;
}

export default function DashboardPage() {
  const user = useUser();
  const firstName = user.name.trim().split(/\s+/)[0];
  const displayFirstName =
    firstName.length > 24 ? `${firstName.slice(0, 24)}…` : firstName;
  const [records, setRecords] = useState<Attendance[]>([]);
  const [capturedImage, setCapturedImage] = useState<File | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

  const loadToday = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${apiUrl}/my-attendances/today?timezoneOffsetMinutes=${new Date().getTimezoneOffset()}`,
        {
          credentials: "include",
        },
      );
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message ?? "Unable to load today's attendance");
      }
      setRecords(result);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load today's attendance",
      );
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadToday(), 0);
    return () => window.clearTimeout(timer);
  }, [loadToday]);

  const checkIn = records.find((record) => record.type === "check_in");
  const checkOut = [...records]
    .reverse()
    .find((record) => record.type === "check_out");
  const action = !checkIn ? "check_in" : !checkOut ? "check_out" : null;
  const actionLabel =
    action === "check_in"
      ? "Clock in now"
      : action === "check_out"
        ? "Clock out now"
        : "Attendance complete";

  const todayLabel = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
      }).format(new Date()),
    [],
  );

  async function submitAttendance() {
    if (!action) return;
    setError("");
    setIsSubmitting(true);
    try {
      const location = await getLocation();
      const imageUrl = capturedImage
        ? await uploadToCloudinary(capturedImage)
        : undefined;
      const response = await fetch(`${apiUrl}/my-attendances`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ type: action, ...location, imageUrl }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(
          Array.isArray(result.message)
            ? result.message.join(", ")
            : (result.message ?? "Unable to record attendance"),
        );
      }
      setCapturedImage(null);
      await loadToday();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to record attendance",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10 md:py-14">
      <div className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-red-950 via-red-800 to-red-600 p-7 text-white shadow-xl shadow-red-950/15 md:p-10">
        <div className="flex flex-col justify-between gap-10 md:flex-row md:items-end">
          <div className="md:flex-1">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-200">
              {todayLabel}
            </p>
            <div className="hidden md:block">
              <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
                Good day, {displayFirstName}.
              </h1>
            </div>
          </div>
          <div className="hidden rounded-2xl bg-white/10 p-5 backdrop-blur-sm md:block">
            <FiClock className="text-3xl text-red-200" aria-hidden="true" />
            <p className="mt-3 text-sm text-red-100">Current status</p>
            <p className="mt-1 text-xl font-semibold">
              {isLoading
                ? "Loading..."
                : checkOut
                  ? "Day completed"
                  : checkIn
                    ? "Currently working"
                    : "Not clocked in"}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      <div className="relative mt-7 grid gap-6 md:grid-cols-[1.3fr_0.7fr]">
        {isLoading && <LoadingOverlay label="Loading today’s attendance" />}
        <section className="rounded-3xl border border-red-100 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-red-600">
                Today&apos;s attendance
              </p>
            </div>
            <FiCheckCircle
              className="text-3xl text-red-200"
              aria-hidden="true"
            />
          </div>
          <div className="mt-8 grid gap-4 grid-cols-2">
            <div className="rounded-2xl bg-green-50 p-5">
              <p className="text-sm font-medium text-green-700">Clock in</p>
              <p className="mt-2 text-3xl font-semibold text-green-950">
                {isLoading ? "--:--" : formatTime(checkIn?.timestamp)}
              </p>
              <p className="mt-1 text-sm text-green-700/70">
                {checkIn ? "Recorded today" : "Not recorded yet"}
              </p>
            </div>
            <div className="rounded-2xl bg-blue-50 p-5">
              <p className="text-sm font-medium text-blue-700">Clock out</p>
              <p className="mt-2 text-3xl font-semibold text-blue-950">
                {isLoading ? "--:--" : formatTime(checkOut?.timestamp)}
              </p>
              <p className="mt-1 text-sm text-blue-700/70">
                {checkOut ? "Recorded today" : "Not recorded yet"}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-red-100 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-2xl font-semibold text-red-950">{actionLabel}</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            {action
              ? "Your location will be captured automatically. A photo is optional."
              : "You have completed your attendance for today. No further action is needed."}
          </p>
          <button
            type="button"
            disabled={!action || isSubmitting}
            onClick={() => {
              setError("");
              setIsCameraOpen(true);
            }}
            className={`mt-6 flex w-full items-center gap-3 rounded-2xl border border-dashed border-zinc-300 px-4 py-4 text-left text-sm text-zinc-600 hover:border-red-400 hover:bg-red-50 ${
              !action || isSubmitting
                ? "cursor-not-allowed opacity-60"
                : "cursor-pointer"
            }`}
          >
            <FiCamera className="text-xl text-red-600" aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate">
              {capturedImage ? "Photo captured" : "Take a photo (optional)"}
            </span>
          </button>
          {action && (
            <div className="mt-4 flex items-center gap-2 text-xs text-zinc-500">
              <FiMapPin aria-hidden="true" />
              Location captured from your device
            </div>
          )}
          <button
            type="button"
            disabled={isLoading || isSubmitting || !action}
            onClick={() => setIsConfirmationOpen(true)}
            className="mt-7 h-12 w-full rounded-xl bg-red-700 text-sm font-semibold text-white shadow-lg shadow-red-700/20 hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Recording..." : actionLabel}
          </button>
        </section>
      </div>

      {isCameraOpen && (
        <CameraDialog
          onClose={() => setIsCameraOpen(false)}
          onCapture={(file) => {
            setCapturedImage(file);
            setIsCameraOpen(false);
          }}
        />
      )}
      {isConfirmationOpen && action && (
        <ConfirmationDialog
          title={`${action === "check_in" ? "Clock in" : "Clock out"} now?`}
          message={`Confirm that you want to ${action === "check_in" ? "clock in" : "clock out"} now. Your current location will be captured.`}
          confirmLabel={action === "check_in" ? "Clock in" : "Clock out"}
          onCancel={() => setIsConfirmationOpen(false)}
          onConfirm={() => {
            setIsConfirmationOpen(false);
            void submitAttendance();
          }}
        />
      )}
    </main>
  );
}
