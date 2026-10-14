// Iconografía lineal estilo Airbnb/Booking: trazo fino, sin emojis.
export type IconName =
  | "logo" | "search" | "user" | "users" | "heart" | "pin" | "star"
  | "check" | "verified" | "x" | "calendar" | "globe" | "sun" | "moon"
  | "arrow" | "arrowLeft" | "plus" | "message" | "case" | "bed" | "home"
  | "ticket" | "gem" | "hands" | "tree" | "waves" | "book" | "download"
  | "rocket" | "refresh"   | "trash" | "logout" | "bot" | "card" | "eye" | "menu" | "send";

const PATHS: Record<IconName, React.ReactNode> = {
  logo: <path d="M12 21c-5 0-8-3-8-8 0-5 4-9 10-10-.5 6-1 12-6 14 2 2 3 4 4 4Zm0 0c0-4 1-8 4-11" />,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.8-3.8" /></>,
  user: <><circle cx="12" cy="8" r="3.6" /><path d="M5 20c.8-3.6 3.4-5.4 7-5.4s6.2 1.8 7 5.4" /></>,
  users: <><circle cx="9" cy="8.5" r="3" /><path d="M3.5 19c.6-3 2.7-4.5 5.5-4.5s4.9 1.5 5.5 4.5" /><path d="M15.5 5.8a3 3 0 0 1 0 5.7M17.5 14.9c1.7.7 2.7 2 3 4.1" /></>,
  heart: <path d="M12 20.5S3.5 15.4 3.5 9.6A4.6 4.6 0 0 1 12 7a4.6 4.6 0 0 1 8.5 2.6c0 5.8-8.5 10.9-8.5 10.9Z" />,
  pin: <><path d="M12 21s-6.5-5.4-6.5-10.4A6.5 6.5 0 0 1 12 4a6.5 6.5 0 0 1 6.5 6.6C18.5 15.6 12 21 12 21Z" /><circle cx="12" cy="10.5" r="2.3" /></>,
  star: <path d="m12 3.5 2.6 5.3 5.9.9-4.2 4.1 1 5.8-5.3-2.8-5.3 2.8 1-5.8L3.5 9.7l5.9-.9L12 3.5Z" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  verified: <><path d="M12 3.5 14.5 5.6 17.5 6l-.4 3.1 2 2.4-2.4 2 .4 3.1-3-.4-2.1 2.1-2.1-2.1-3 .4.4-3.1-2.4-2 2-2.4L6.5 6l3-.4L12 3.5Z" /><path d="m9.7 12.2 1.7 1.7 3-3.2" /></>,
  x: <path d="m6 6 12 12M18 6 6 18" />,
  calendar: <><rect x="4" y="5.5" width="16" height="15" rx="2.5" /><path d="M4 10.5h16M8.5 3.5v4M15.5 3.5v4" /></>,
  globe: <><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c2.5 2.3 3.8 5.2 3.8 8.5s-1.3 6.2-3.8 8.5c-2.5-2.3-3.8-5.2-3.8-8.5s1.3-6.2 3.8-8.5Z" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5 5l1.8 1.8M17.2 17.2 19 19M19 5l-1.8 1.8M6.8 17.2 5 19" /></>,
  moon: <path d="M20 15.5A8.5 8.5 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5Z" />,
  arrow: <path d="M4 12h15M13.5 6 20 12l-6.5 6" />,
  arrowLeft: <path d="M20 12H5M10.5 6 4 12l6.5 6" />,
  plus: <path d="M12 5v14M5 12h14" />,
  message: <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H9l-5 4.5V6.5Z" />,
  case: <><rect x="4.5" y="8" width="15" height="12" rx="2.5" /><path d="M9 8V6.5A1.5 1.5 0 0 1 10.5 5h3A1.5 1.5 0 0 1 15 6.5V8M4.5 13h15" /></>,
  bed: <><path d="M3 18v-8M3 14h18v4M6 14v-2.5A1.5 1.5 0 0 1 7.5 10H18a2 2 0 0 1 2 2v2" /><circle cx="6.5" cy="10.5" r="1.5" /></>,
  home: <><path d="m4 11 8-7 8 7" /><path d="M6 9.5V19a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V9.5" /></>,
  ticket: <><path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h13A1.5 1.5 0 0 1 20 8.5v2a2.5 2.5 0 0 0 0 5v2a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5v-2a2.5 2.5 0 0 0 0-5v-2Z" /><path d="M13.5 7v2M13.5 11.5v2M13.5 16v2" /></>,
  gem: <><path d="M7 4h10l4 5-9 11L3 9l4-5Z" /><path d="M3 9h18M9.5 9 12 20 14.5 9M7 4l2.5 5L12 4l2.5 5L17 4" /></>,
  hands: <><path d="M7 11.5V6.5a1.5 1.5 0 0 1 3 0v4m0-5.5a1.5 1.5 0 0 1 3 0V9m0-4a1.5 1.5 0 0 1 3 0v6m0-3a1.5 1.5 0 0 1 3 0v4c0 3.5-2.5 7-7 7-2.5 0-4-1-5.5-3L3 13.5c-.8-1 .2-2.4 1.4-2L7 13" /></>,
  tree: <><path d="M12 3 6.5 11h3L5 17h14l-4.5-6h3L12 3Z" /><path d="M12 17v4" /></>,
  waves: <><path d="M3 9c2 0 2 1.5 4 1.5S9 9 11 9s2 1.5 4 1.5S17 9 19 9M3 15c2 0 2 1.5 4 1.5S9 15 11 15s2 1.5 4 1.5 2-1.5 4-1.5" /></>,
  book: <><path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5V4.5Z" /><path d="M5 19.5A1.5 1.5 0 0 1 6.5 18H19" /></>,
  download: <><path d="M12 4v11M7.5 11 12 15.5 16.5 11" /><path d="M4.5 19.5h15" /></>,
  rocket: <><path d="M12 15c5-4 7-8 7-11-3 0-7 2-11 7l4 4Z" /><path d="M9 12 5.5 13.5c-1 2.5-1.5 5-1.5 6 1 0 3.5-.5 6-1.5L11 14.5M12 15l-1 4.5M15 12l4.5-1" /></>,
  refresh: <><path d="M19.5 12a7.5 7.5 0 0 1-13 5.1M4.5 12a7.5 7.5 0 0 1 13-5.1" /><path d="M17.5 3.5v4h-4M6.5 20.5v-4h4" /></>,
  trash: <><path d="M4.5 6.5h15M9.5 6V4.5A1.5 1.5 0 0 1 11 3h2a1.5 1.5 0 0 1 1.5 1.5V6" /><path d="M6.5 6.5 7.4 20a1 1 0 0 0 1 1h7.2a1 1 0 0 0 1-1l.9-13.5" /></>,
  logout: <><path d="M14 4h-8v16h8" /><path d="M10 12h11M18 8.5 21.5 12 18 15.5" /></>,
  bot: <><rect x="5" y="9" width="14" height="10" rx="2.5" /><path d="M12 9V5.5M9 5.5h6" /><circle cx="9.5" cy="13.5" r=".8" /><circle cx="14.5" cy="13.5" r=".8" /><path d="M9.5 16.5h5" /></>,
  card: <><rect x="3.5" y="6" width="17" height="12.5" rx="2.5" /><path d="M3.5 10.5h17M7 15h4" /></>,
  eye: <><path d="M3.5 12S6 6.5 12 6.5 20.5 12 20.5 12 18 17.5 12 17.5 3.5 12 3.5 12Z" /><circle cx="12" cy="12" r="2.5" /></>,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  send: <><path d="M20 4 10.5 13.5M20 4l-6.5 16-3-6.5L4 10.5 20 4Z" /></>,
};

export function Icon({ name, size = 20, filled = false }: { name: IconName; size?: number; filled?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ flexShrink: 0, verticalAlign: "-3px" }}
    >
      {PATHS[name]}
    </svg>
  );
}
