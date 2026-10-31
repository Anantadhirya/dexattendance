import AttendanceHistory from "../../../components/attendance-history";

export default function AttendancePage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

  return (
    <AttendanceHistory
      endpoint={`${apiUrl}/my-attendances`}
      title="My attendance"
      subtitle="Review your attendance history by day."
      className="px-6 py-10"
    />
  );
}
