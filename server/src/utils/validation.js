export const SEAT_PRICE = 180;
export const SEAT_PATTERN = /^[A-F](0[1-9]|1[0-2])$/;
export const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
export const SHOWTIME_PATTERN = /^(0?[1-9]|1[0-2]):[0-5]\d (AM|PM)$/;

/** 1-10 unique seats in the A01-F12 range. */
export function validSeats(seats) {
  return Array.isArray(seats)
    && seats.length > 0
    && seats.length <= 10
    && seats.every((seat) => typeof seat === 'string' && SEAT_PATTERN.test(seat))
    && new Set(seats).size === seats.length;
}

/** Strict YYYY-MM-DD check that also rejects impossible dates such as 2026-02-31. */
export function isValidDateString(value) {
  if (typeof value !== 'string' || !DATE_PATTERN.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

/**
 * The API cannot know the caller's timezone, so allow one day of slack.
 * Without this, a user in UTC-8 booking "today" after 16:00 local time would be
 * rejected because the server's UTC date is already tomorrow.
 */
export function isPastDate(value) {
  const earliest = new Date();
  earliest.setUTCDate(earliest.getUTCDate() - 1);
  return value < earliest.toISOString().slice(0, 10);
}

export function validShowtime(value) {
  return typeof value === 'string' && value.length <= 20 && SHOWTIME_PATTERN.test(value);
}
