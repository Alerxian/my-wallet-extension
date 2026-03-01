window.addEventListener("message", (event) => {
  if (
    event.source !== window ||
    !event.data ||
    !event.data.type ||
    event.data.from !== "injected-helper"
  ) {
    return
  }

  chrome.runtime.sendMessage(
    {
      type: event.data.type,
      requestId: event.data.requestId,
      data: event.data.data
    },
    (response) => {
      if (chrome.runtime.lastError) {
        window.postMessage(
          {
            from: "message-bridge",
            requestId: event.data.requestId,
            success: false,
            error: chrome.runtime.lastError.message
          },
          "*"
        )
        return
      }

      if (!response?.success) {
        window.postMessage(
          {
            from: "message-bridge",
            requestId: event.data.requestId,
            success: false,
            error: response?.error || "Unknown error"
          },
          "*"
        )
        return
      }

      window.postMessage(
        {
          from: "message-bridge",
          requestId: event.data.requestId,
          success: true,
          data: response.data ?? {}
        },
        "*"
      )
    }
  )
})
