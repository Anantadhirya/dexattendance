export type User = {
  id: string;
  name: string;
  email: string;
  workSchedule: {
    name: string;
    startTime: string;
    endTime: string;
    lateThreshold: number;
  };
};

export type Attendance = {
  id: string;
  userId: string;
  type: "check_in" | "check_out";
  timestamp: string;
  user: User;
};

export type Status =
  | "missing"
  | "checked_in"
  | "checked_out"
  | "late"
  | "on_time";

export type Selection =
  | { type: "interval"; start: number; end: number }
  | { type: "status"; status: Status };

export type UserStatus = {
  user: User;
  attendance: "missing" | "checked_in" | "checked_out";
  punctuality: "missing" | "late" | "on_time";
  checkIn?: Attendance;
  checkOut?: Attendance;
};

export type ChartStatus = {
  status: Status;
  name: string;
  value: number;
};

export type LineDataPoint = {
  minute: number;
  label: string;
  "Active Employees": number | null;
};
