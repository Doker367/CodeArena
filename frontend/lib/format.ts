export const money = (value: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 })
    .format(value)
    .replace("MX$", "$");

export const moneyCents = (value: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(value);

export const dateLabel = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "long", year: "numeric" }).format(date);
};

export const timeLabel = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false }).format(date);
};

export const relativeLabel = (iso: string) => {
  const date = new Date(iso).getTime();
  if (Number.isNaN(date)) return iso;
  const diff = Date.now() - date;
  const today = new Date();
  const sameDay = new Date(date).toDateString() === today.toDateString();
  if (sameDay) return timeLabel(iso);
  const mins = Math.round(diff / 60000);
  if (mins < 60) return `Hace ${Math.max(1, mins)} min`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `Hace ${hours} h`;
  const days = Math.round(hours / 24);
  return days === 1 ? "Ayer" : `Hace ${days} días`;
};
