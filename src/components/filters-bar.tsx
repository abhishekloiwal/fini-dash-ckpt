"use client";

import type { FilterState } from "@/data/mockData";
import { filterOptions } from "@/data/mockData";

type FiltersBarProps = {
  value: FilterState;
  onChange: (next: FilterState) => void;
};

const FiltersBar = ({ value, onChange }: FiltersBarProps) => {
  const handleChange =
    (field: keyof FilterState) => (event: React.ChangeEvent<HTMLSelectElement>) => {
      onChange({ ...value, [field]: event.target.value });
    };

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <FilterSelect
        label="Date range"
        value={value.dateRange}
        onChange={handleChange("dateRange")}
        options={filterOptions.dateRanges}
      />
      <FilterSelect
        label="Channel"
        value={value.channel}
        onChange={handleChange("channel")}
        options={filterOptions.channels}
      />
      <FilterSelect
        label="Intent / Tag"
        value={value.intent}
        onChange={handleChange("intent")}
        options={filterOptions.intents}
      />
    </div>
  );
};

type FilterSelectProps = {
  label: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  options: string[];
};

const FilterSelect = ({ label, value, onChange, options }: FilterSelectProps) => (
  <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-slate-500">
    {label}
    <select
      value={value}
      onChange={onChange}
      className="mt-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  </label>
);

export default FiltersBar;
