"use client";

import { useEffect, useRef, useState } from "react";
import { FiChevronLeft, FiChevronRight, FiCalendar } from "react-icons/fi";

type DateRangePickerProps = {
  startDate: string;
  endDate: string;
  onChange: (startDate: string, endDate: string) => void;
};

function toKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

export default function DateRangePicker({
  startDate,
  endDate,
  onChange,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSelectingEnd, setIsSelectingEnd] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const gridStart = new Date(firstDay);
  gridStart.setDate(1 - firstDay.getDay());
  const days = Array.from({ length: 42 }, (_, index) => {
    const day = new Date(gridStart);
    day.setDate(gridStart.getDate() + index);
    return day;
  });

  useEffect(() => {
    function handleOutsideClick(event: PointerEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setIsSelectingEnd(false);
      }
    }

    document.addEventListener("pointerdown", handleOutsideClick);
    return () => document.removeEventListener("pointerdown", handleOutsideClick);
  }, []);

  function chooseDay(day: Date) {
    const key = toKey(day);
    if (!isSelectingEnd) {
      onChange(key, key);
      setIsSelectingEnd(true);
    } else if (key < startDate) {
      onChange(key, startDate);
      setIsSelectingEnd(false);
    } else {
      onChange(startDate, key);
      setIsSelectingEnd(false);
    }
  }

  const label =
    startDate && endDate
      ? startDate === endDate
        ? formatDate(startDate)
        : `${formatDate(startDate)} to ${formatDate(endDate)}`
      : startDate
        ? `${formatDate(startDate)} to Select end date`
        : "Select date range";

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="flex h-11 w-full items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 text-left text-sm text-zinc-950 focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-100"
      >
        <FiCalendar className="shrink-0 text-red-600" aria-hidden="true" />
        <span className="truncate">{label}</span>
      </button>
      {isOpen && (
        <div className="absolute left-0 top-12 z-20 w-80 rounded-2xl border border-zinc-200 bg-white p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <button type="button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} aria-label="Previous month" className="rounded-lg p-2 text-zinc-500 hover:bg-red-50 hover:text-red-700">
              <FiChevronLeft aria-hidden="true" />
            </button>
            <p className="text-sm font-semibold text-red-950">
              {new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(month)}
            </p>
            <button type="button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} aria-label="Next month" className="rounded-lg p-2 text-zinc-500 hover:bg-red-50 hover:text-red-700">
              <FiChevronRight aria-hidden="true" />
            </button>
          </div>
          <div className="mt-3 grid grid-cols-7 text-center text-xs font-semibold text-zinc-400">
            {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => <span key={`${day}-${index}`} className="py-2">{day}</span>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const key = toKey(day);
              const selected = key === startDate || key === endDate;
              const between = startDate && endDate && key > startDate && key < endDate;
              return (
                <button
                  type="button"
                  key={key}
                  onClick={() => chooseDay(day)}
                  className={`h-9 rounded-lg text-xs ${
                    selected
                      ? "bg-red-700 font-semibold text-white"
                      : between
                        ? "bg-red-50 text-red-800"
                        : day.getMonth() === month.getMonth()
                          ? "text-zinc-700 hover:bg-zinc-100"
                          : "text-zinc-300"
                  }`}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>
          <button type="button" onClick={() => { onChange("", ""); setIsSelectingEnd(false); setIsOpen(false); }} className="mt-3 w-full text-sm text-zinc-500 hover:text-red-700">
            Clear dates
          </button>
        </div>
      )}
    </div>
  );
}
