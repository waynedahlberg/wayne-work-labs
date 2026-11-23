/** Any route the overlay doesn't handle clears the slot, which is what closes the overlay on a soft navigation. */
export default function CatchAll() {
  return null;
}
