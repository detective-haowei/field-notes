/** Inline icons, sized to the text they sit beside. */

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" {...stroke}>
      <circle cx="6" cy="6" r="4" />
      <path d="M9 9l3.5 3.5" />
    </svg>
  );
}

export function GearIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
    </svg>
  );
}

/** The chevron on a disclosure button; it rotates via CSS. */
export function CaretIcon({ size = 10 }: { size?: number }) {
  return (
    <svg className="car" width={size} height={size} viewBox="0 0 10 10" {...stroke}>
      <path d="M2 3.5l3 3 3-3" />
    </svg>
  );
}

export function ChevronDownIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" {...stroke} strokeWidth={1.8}>
      <path d="M3 4.5 6 7.5 9 4.5" />
    </svg>
  );
}

export function ChevronLeftIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" {...stroke} strokeWidth={1.7}>
      <path d="M9 2.5 4.5 7 9 11.5" />
    </svg>
  );
}

export function ChevronRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" {...stroke} strokeWidth={1.7}>
      <path d="M5 2.5 9.5 7 5 11.5" />
    </svg>
  );
}

/** Arrow out of a tray. */
export function ExportIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" {...stroke}>
      <path d="M7 9V2M4 5l3-3 3 3M2 10v2h10v-2" />
    </svg>
  );
}

/** Arrow into a tray; also used for "download this week". */
export function ImportIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" {...stroke}>
      <path d="M7 2v7M4 6l3 3 3-3M2 10v2h10v-2" />
    </svg>
  );
}

export function ManageIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" {...stroke}>
      <path d="M2 4h10M2 7h10M2 10h10" />
      <circle cx="5" cy="4" r="1.3" fill="var(--card)" />
      <circle cx="9" cy="7" r="1.3" fill="var(--card)" />
      <circle cx="6" cy="10" r="1.3" fill="var(--card)" />
    </svg>
  );
}

export function FilterIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" {...stroke}>
      <path d="M2 4h10M4 7h6M6 10h2" />
    </svg>
  );
}

export function CalendarIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" {...stroke} strokeWidth={1.5}>
      <rect x="2" y="3" width="10" height="9" rx="1.5" />
      <path d="M2 6h10M5 1.5v3M9 1.5v3" />
    </svg>
  );
}

export function ClipIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z" />
    </svg>
  );
}

export function FileIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" {...stroke} strokeWidth={1.5}>
      <path d="M3.5 1.5h4l3 3v8h-7z" />
      <path d="M7.5 1.5v3h3" />
    </svg>
  );
}

export function SendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19 7v4H5.83l3.58-3.59L8 6l-6 6 6 6 1.41-1.41L5.83 13H21V7z" />
    </svg>
  );
}
