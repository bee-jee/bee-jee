export const MILLIS_IN_A_SECOND = 1000;

export const SECONDS_IN_A_MINUTE = 60;

export const MINUTES_IN_A_HOUR = 60;

export const HOURS_IN_A_DAY = 24;

export function millisToDays(millis: number) {
  return millis / (MILLIS_IN_A_SECOND * SECONDS_IN_A_MINUTE * MINUTES_IN_A_HOUR * HOURS_IN_A_DAY);
}

export function millisInMinutes(millis: number) {
  return millis / (MILLIS_IN_A_SECOND * SECONDS_IN_A_MINUTE);
}
