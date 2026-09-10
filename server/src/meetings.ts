export const MEETING_ORGANS = [
  "conference",
  "conseil",
  "comite",
  "cts",
  "autre",
] as const;

export type MeetingOrgan = (typeof MEETING_ORGANS)[number];

export const isMeetingOrgan = (v: string): v is MeetingOrgan =>
  (MEETING_ORGANS as readonly string[]).includes(v);
