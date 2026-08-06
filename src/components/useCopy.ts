import { useCallback, useState } from 'react'

/** Copy text to clipboard; returns [copiedKey, copy(key,text)]. */
export function useCopy(resetMs = 1100) {
  const [copied, setCopied] = useState<string | null>(null)
  const copy = useCallback(
    async (key: string, text: string) => {
      try {
        await navigator.clipboard.writeText(text)
      } catch {
        // fallback for insecure contexts
        const ta = document.createElement('textarea')
        ta.value = text
        ta.style.position = 'fixed'
        ta.style.opacity = '0'
        document.body.appendChild(ta)
        ta.select()
        try {
          document.execCommand('copy')
        } catch {
          /* noop */
        }
        ta.remove()
      }
      setCopied(key)
      window.setTimeout(() => setCopied((c) => (c === key ? null : c)), resetMs)
    },
    [resetMs],
  )
  return [copied, copy] as const
}
