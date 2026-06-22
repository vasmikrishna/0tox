export interface BookingConfig {
  slotMinutes: number
  startHour: number
  endHour: number
  workingDays: number[] // 0=Sun, 1=Mon … 6=Sat
  bufferMinutes: number
}

export const DEFAULT_BOOKING_CONFIG: BookingConfig = {
  slotMinutes: 60,
  startHour: 9,
  endHour: 18,
  workingDays: [1, 2, 3, 4, 5, 6], // Mon–Sat
  bufferMinutes: 0,
}

export function getBookingConfig(settings: Record<string, unknown> | null | undefined): BookingConfig {
  const raw = (settings as Record<string, unknown>)?.booking as Partial<BookingConfig> | undefined
  if (!raw) return DEFAULT_BOOKING_CONFIG
  return {
    slotMinutes: typeof raw.slotMinutes === "number" && raw.slotMinutes > 0 ? raw.slotMinutes : DEFAULT_BOOKING_CONFIG.slotMinutes,
    startHour: typeof raw.startHour === "number" ? raw.startHour : DEFAULT_BOOKING_CONFIG.startHour,
    endHour: typeof raw.endHour === "number" ? raw.endHour : DEFAULT_BOOKING_CONFIG.endHour,
    workingDays: Array.isArray(raw.workingDays) ? raw.workingDays : DEFAULT_BOOKING_CONFIG.workingDays,
    bufferMinutes: typeof raw.bufferMinutes === "number" ? raw.bufferMinutes : DEFAULT_BOOKING_CONFIG.bufferMinutes,
  }
}
