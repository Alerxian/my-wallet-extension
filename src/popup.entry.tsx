import { useEffect } from "react"

import { Toaster } from "./components/ui/sonner"
import { Index } from "./pages/Index"

import "./style.css"

function IndexPopup() {
  useEffect(() => {
    const root = window.document.documentElement
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
