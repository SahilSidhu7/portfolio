import { useEffect } from 'react'

// Scroll reveal: any element under `rootRef` with a `data-reveal` attribute
// gets `is-in` once it scrolls into view. A MutationObserver picks up
// elements rendered later (projects and papers arrive from the API).
// The hidden starting state lives in CSS behind prefers-reduced-motion,
// so with reduced motion everything is simply visible.
export default function useReveal(rootRef) {
  useEffect(() => {
    const root = rootRef.current
    if (!root || typeof IntersectionObserver === 'undefined') return

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in')
            io.unobserve(entry.target)
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
    )

    const watch = (scope) => {
      if (scope.matches?.('[data-reveal]:not(.is-in)')) io.observe(scope)
      scope.querySelectorAll?.('[data-reveal]:not(.is-in)').forEach((el) => io.observe(el))
    }
    watch(root)

    const mo = new MutationObserver((records) => {
      for (const record of records) record.addedNodes.forEach((node) => node.nodeType === 1 && watch(node))
    })
    mo.observe(root, { childList: true, subtree: true })

    return () => {
      io.disconnect()
      mo.disconnect()
    }
  }, [rootRef])
}
