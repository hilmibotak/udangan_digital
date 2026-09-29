export function isKnownResource(resource: string) {
  return [
    "events",
    "gallery",
    "gifts",
    "guests",
    "love-stories",
    "music",
    "rsvp",
    "wishes",
  ].includes(resource);
}

export function resourceError(message: string, status = 400) {
  return { success: false, message, status };
}
