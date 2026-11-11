/** Open circle (origin) → dotted line → filled square (destination). */
export function RouteConnector({ inset = 6 }: { inset?: number }) {
  return (
    <span aria-hidden className="flex w-3.5 flex-col items-center" style={{ paddingBlock: inset }}>
      <span className="border-ink-muted size-[11px] shrink-0 rounded-full border-2" />
      <span className="border-hairline-tertiary my-1 w-0 flex-1 border-l-2 border-dotted" />
      <span className="bg-ink size-[11px] shrink-0 rounded-[3px]" />
    </span>
  )
}
