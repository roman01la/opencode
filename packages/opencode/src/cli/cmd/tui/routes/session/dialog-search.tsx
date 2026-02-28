import { createMemo, onMount } from "solid-js"
import { useSync } from "@tui/context/sync"
import { DialogSelect, type DialogSelectOption } from "@tui/ui/dialog-select"
import type { TextPart, ToolPart } from "@opencode-ai/sdk/v2"
import { Locale } from "@/util/locale"
import { useDialog } from "../../ui/dialog"

export function DialogSearch(props: {
  sessionID: string
  onMove: (messageID: string) => void
}) {
  const sync = useSync()
  const dialog = useDialog()

  onMount(() => {
    dialog.setSize("large")
  })

  const options = createMemo((): DialogSelectOption<string>[] => {
    const messages = sync.data.message[props.sessionID] ?? []
    const result = [] as DialogSelectOption<string>[]
    for (const message of messages) {
      const parts = sync.data.part[message.id] ?? []
      const footer = Locale.time(message.time.created)

      if (message.role === "user") {
        const textPart = parts.find(
          (x): x is TextPart => x.type === "text" && !x.synthetic && !x.ignored,
        )
        if (!textPart) continue
        result.push({
          title: textPart.text.replace(/\n/g, " "),
          value: message.id,
          category: "User",
          footer,
        })
      } else if (message.role === "assistant") {
        for (const part of parts) {
          if (part.type === "text" && !part.synthetic && !part.ignored && (part as TextPart).text.trim()) {
            result.push({
              title: (part as TextPart).text.replace(/\n/g, " "),
              value: message.id,
              category: "Assistant",
              footer,
            })
            break
          }
          if (part.type === "tool" && (part as ToolPart).state.status === "completed") {
            const tool = part as ToolPart & { state: { status: "completed"; title: string } }
            result.push({
              title: `${tool.tool}: ${tool.state.title}`,
              value: message.id,
              category: "Tool",
              footer,
            })
          }
        }
      }
    }
    result.reverse()
    return result
  })

  return (
    <DialogSelect
      onMove={(option) => props.onMove(option.value)}
      title="Search"
      placeholder="Search messages..."
      options={options()}
    />
  )
}
