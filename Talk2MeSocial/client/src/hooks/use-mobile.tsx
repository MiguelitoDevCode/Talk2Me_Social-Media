import * as React from "react"

const MOBILE_BREAKPOINT = 768

// Generic media query hook
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = React.useState<boolean>(false)

  React.useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = () => {
      setMatches(mql.matches)
    }

    mql.addEventListener("change", onChange)
    setMatches(mql.matches)

    return () => mql.removeEventListener("change", onChange)
  }, [query])

  return matches
}

// Mobile-specific hook using the media query hook
export function useIsMobile() {
  return useMediaQuery(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
}
