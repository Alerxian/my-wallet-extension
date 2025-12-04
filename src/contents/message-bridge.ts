window.addEventListener("message", (event) => {
  console.log("收到来自injected-helper的消息:", event.data)
  if (
    event.source !== window ||
    !event.data ||
    !event.data.type ||
    event.data.from !== "injected-helper"
  )
    return

  console.log("event.data:发送到background:", event.data)

  chrome.runtime.sendMessage(
    {
      type: event.data.type,
      requestId: event.data.requestId,
      data: event.data.data
    },
    (response) => {
      console.log("收到来自 background 的响应：", response)
      if (chrome.runtime.lastError) {
        console.error("转发消息到background失败：", chrome.runtime.lastError)
        window.postMessage(
          {
            from: "message-bridge",
            requestId: event.data.requestId,
            success: false,
            error: chrome.runtime.lastError.message
          },
          window.location.origin
        )
        return
      }

      if (!response.success || response.error || !response.data) {
        window.postMessage(
          {
            from: "message-bridge",
            requestId: event.data.requestId,
            success: false,
            error: response.error || "未知错误"
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
          data: response.data
        },
        "*"
      )
    }
  )
})
