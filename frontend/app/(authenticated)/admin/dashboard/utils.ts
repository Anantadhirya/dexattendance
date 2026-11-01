import type { Attendance, User } from "./types";

export const firstChartColors = ["#ef4444", "#22c55e", "#3b82f6"];
export const secondChartColors = ["#ef4444", "#fbbf24", "#22c55e"];

export function localDateKey() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function currentLocalMinute() {
  const date = new Date();
  return date.getHours() * 60 + date.getMinutes();
}

export function minutesOf(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export function timeOf(timestamp: string) {
  const date = new Date(timestamp);
  return date.getHours() * 60 + date.getMinutes();
}

export function formatTime(timestamp: string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(timestamp));
}

export function formatScheduleDifference(actual: string, scheduled: string) {
  const difference = timeOf(actual) - minutesOf(scheduled);
  if (difference === 0) return "On time";
  if (difference > 0) return `${difference} minutes late`;
  return `${Math.abs(difference)} minutes early`;
}

export function isBeyondLateThreshold(user: User, timestamp: string) {
  return (
    timeOf(timestamp) >
    minutesOf(user.workSchedule.startTime) + user.workSchedule.lateThreshold
  );
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "long" }).format(
    new Date(`${value}T12:00:00`),
  );
}

export function statusLabel(status: string) {
  return status.replace("_", " ");
}

export function formatMinute(minute: number) {
  if (minute >= 1440) return "23:59";
  return `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
}

export function formatChartTime(minute: number) {
  if (minute >= 1440) return "24:00";
  return formatMinute(minute);
}

export function statusFor(user: User, records: Attendance[]) {
  const checkIn = records.find((record) => record.type === "check_in");
  const checkOut = [...records]
    .reverse()
    .find((record) => record.type === "check_out");
  if (!checkIn) {
    return { attendance: "missing" as const, punctuality: "missing" as const };
  }
  const late =
    timeOf(checkIn.timestamp) >
    minutesOf(user.workSchedule.startTime) + user.workSchedule.lateThreshold;
  return {
    attendance: (checkOut ? "checked_out" : "checked_in") as
      | "checked_out"
      | "checked_in",
    punctuality: (late ? "late" : "on_time") as "late" | "on_time",
    checkIn,
    checkOut,
  };
}
