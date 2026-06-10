import { Bot, User } from 'lucide-react'
import type { AIMessage } from '@/store/useStudioStore'

interface Props {
  message: AIMessage
}

export default function ChatMessage({ message }: Props) {
  const isUser = message.role === 'user'

  // Strip the "[Context: ...]" prefix we prepend for mode context
  const displayContent = message.content.replace(/^\[Context:[^\]]*\]\n\n/, '')

  if (isUser) {
    return (
      <div className="flex justify-end animate-slide-up">
        <div className="max-w-[80%] bg-brand text-white text-sm px-3.5 py-2.5 rounded-2xl rounded-br-sm shadow-sm allow-select">
          <p className="whitespace-pre-wrap break-words leading-relaxed">{displayContent}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-2 items-start animate-slide-up">
      <div className="w-6 h-6 rounded-full bg-brand/20 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Bot size={12} className="text-brand" />
      </div>
      <div className="max-w-[85%] bg-sidebar-hover text-sidebar-text-active text-sm px-3.5 py-2.5 rounded-2xl rounded-bl-sm allow-select">
        {/* Render markdown-like formatting */}
        <div className="whitespace-pre-wrap break-words leading-relaxed prose-sm">
          {formatMessage(displayContent)}
        </div>
        {message.model_used && (
          <p className="text-[10px] text-sidebar-text/30 mt-1.5 border-t border-sidebar-border/30 pt-1">
            {message.model_used.split('/').pop()?.split(':')[0]}
          </p>
        )}
      </div>
    </div>
  )
}

// Simple inline formatter for bold/italic/code
function formatMessage(text: string): React.ReactNode {
  if (!text) return null

  // Split into lines and process
  return text.split('\n').map((line, i) => {
    // Bold
    line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic
    line = line.replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Code
    line = line.replace(/`(.*?)`/g, '<code class="bg-black/20 px-1 py-0.5 rounded text-xs font-mono">$1</code>')

    return (
      <span key={i}>
        <span dangerouslySetInnerHTML={{ __html: line || '&nbsp;' }} />
        {i < text.split('\n').length - 1 && <br />}
      </span>
    )
  })
}
