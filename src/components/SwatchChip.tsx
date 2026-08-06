import { useCopy } from './useCopy'
import { readableText } from '../lib/color'

/** Clickable color chip that copies its code on click. */
export function SwatchChip({ hex, label }: { hex: string; label?: string }) {
  const [copied, copy] = useCopy()
  const code = label ?? hex
  const isCopied = copied === hex
  return (
    <button
      type="button"
      className="chip"
      onClick={() => copy(hex, hex)}
      title={`Copy ${hex}`}
    >
      <span
        className="chip__face"
        style={{ background: hex, color: readableText(hex) }}
      />
      <span className={`chip__code${isCopied ? ' chip__copied' : ''}`}>
        {isCopied ? 'copied ✓' : code}
      </span>
    </button>
  )
}
