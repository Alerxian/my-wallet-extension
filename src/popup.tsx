import { useEffect } from "react"

import { Toaster } from "~components/ui/sonner"
import { Index } from "~pages/Index"

import "~style.css"

function IndexPopup() {
  useEffect(() => {
    const root = window.document.documentElement
    // root.classList.remove("light", "dark")
    // if (theme === "system") {
    //   const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
    //     .matches
    //     ? "dark"
    //     : "light"

    //   root.classList.add(systemTheme)
    //   return
    // }
    root.classList.add("dark")
  }, [])
  return (
    <>
      <Toaster />
      <Index />
    </>
  )
}

export default IndexPopup
