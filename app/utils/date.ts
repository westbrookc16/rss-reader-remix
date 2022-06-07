export function formatDateWithoutTime(a: Date) {
  const d = new Date(a);
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
}
export function formatDateWithTime(a: Date | null) {
  if (a === null) return "";
  const d = new Date(a);
  const dateString = `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
  const hours = d.getHours();
  let returnedHours = hours;
  let ampm = "AM";
  if (hours === 0) {
    returnedHours = 12;
  }
  if (hours > 12) {
    returnedHours = hours % 12;
    ampm = "PM";
  }
  if (hours === 12) {
    ampm = "PM";
  }
  let returnedMinutes: string = String(d.getMinutes());
  if (d.getMinutes() < 10) {
    returnedMinutes = "0" + returnedMinutes;
  }
  return `${dateString} ${returnedHours}:${returnedMinutes} ${ampm}`;
}
