import * as React from 'react';

import { cn } from '../../lib/utils';

import type { ProfileFieldProps, ProfileSelectFieldProps } from './types';

const inputClassName =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 read-only:cursor-default read-only:bg-muted/30';

export function ProfileField({
  id,
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  className,
  readOnly = false,
  hint,
}: ProfileFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <label className="text-sm font-medium text-foreground" htmlFor={id}>
        {label}
      </label>
      <input
        className={inputClassName}
        id={id}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
        placeholder={placeholder}
        readOnly={readOnly}
        type={type}
        value={value}
      />
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function ProfileSelectField({
  id,
  label,
  value,
  onChange,
  options,
  className,
  readOnly = false,
  hint,
}: ProfileSelectFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <label className="text-sm font-medium text-foreground" htmlFor={id}>
        {label}
      </label>
      <select
        className={inputClassName}
        disabled={readOnly}
        id={id}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
        value={value}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
