import clsx from "clsx";

export function cn(...values: Array<string | false | null | undefined>) {
  return clsx(values);
}

export function formatDate(value?: string | Date | null) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatPercentage(value: number) {
  return `${value.toFixed(0)}%`;
}

export function resolveMediaUrl(value?: string | null) {
  if (!value) {
    return null;
  }

  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("data:") ||
    value.startsWith("blob:")
  ) {
    return value;
  }

  const apiBase = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api";
  const origin = new URL(apiBase).origin;

  if (value.startsWith("/")) {
    return `${origin}${value}`;
  }

  return `${origin}/${value}`;
}
