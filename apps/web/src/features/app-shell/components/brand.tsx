export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <img src="/logo-mark.svg" alt="" className={compact ? 'size-7' : 'size-8'} />
      <span
        className={
          compact
            ? 'text-[17px] font-medium tracking-[-0.4px]'
            : 'text-lg font-medium tracking-[-0.4px]'
        }
      >
        SkyRig
      </span>
    </div>
  )
}
