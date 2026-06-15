import { useState, useRef, useEffect } from 'react'
import { X, Send, Plus, Bot, Sparkles, BookOpen, SearchCheck } from 'lucide-react'
import { useStudioStore } from '@/store/useStudioStore'
import ChatMessage from './ChatMessage'
import { FREE_MODELS } from '@/lib/constants'

// Mode descriptions shown to users
const MODES = [
  {
    id: 'write',
    label: 'Write',
    icon: <Sparkles size={13} />,
    system: 'Help me improve my creative writing. Be specific and suggest concrete rewrites when appropriate.',
    color: 'text-violet-600',
  },
  {
    id: 'publish',
    label: 'Publish',
    icon: <BookOpen size={13} />,
    system: 'Answer my questions about the publishing industry — both traditional and self-publishing.',
    color: 'text-neutral-400',
  },
  {
    id: 'factcheck',
    label: 'Fact-Check',
    icon: <SearchCheck size={13} />,
    system: 'Help me fact-check whether the scenario I describe is realistic and accurate.',
    color: 'text-amber-600',
  },
]

export default function AIChatOverlay() {
  const {
    setChatOpen,
    aiConversations,
    activeConversationId,
    aiMessages,
    isAILoading,
    activeManuscript,
    settings,
    createConversation,
    setActiveConversation,
    sendMessage,
    fetchConversations,
    setSetting,
  } = useStudioStore()

  const [input, setInput] = useState('')
  const [activeMode, setActiveMode] = useState('write')
  const [showModelPicker, setShowModelPicker] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const rawModel = settings.openrouter_model ?? FREE_MODELS[0].id
  const selectedModel = FREE_MODELS.some(m => m.id === rawModel) ? rawModel : FREE_MODELS[0].id

  // Play/pause video based on AI loading state
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    if (isAILoading) {
      video.currentTime = 0
      video.play().catch(() => {})
    } else {
      video.pause()
    }
  }, [isAILoading])

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [aiMessages])

  // Load conversations and create one if needed
  useEffect(() => {
    async function init() {
      await fetchConversations(activeManuscript?.id)
      if (!activeConversationId) {
        await createConversation(activeManuscript?.id)
      }
    }
    init()
  }, [])

  async function handleSend() {
    const text = input.trim()
    if (!text || isAILoading) return

    // If no conversation yet, create one
    let convId = activeConversationId
    if (!convId) {
      const conv = await createConversation(activeManuscript?.id)
      convId = conv.id
    }

    setInput('')

    // Prepend mode context to first message if messages are empty
    const modeContext = aiMessages.length === 0
      ? MODES.find(m => m.id === activeMode)?.system ?? ''
      : ''

    const fullText = modeContext ? `[Context: ${modeContext}]\n\n${text}` : text
    await sendMessage(fullText, selectedModel)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="fixed bottom-5 right-5 w-96 bg-[#000000] rounded-2xl shadow-chat border border-sidebar-border flex flex-col z-50 animate-slide-up overflow-hidden"
      style={{ maxHeight: 'calc(100vh - 80px)' }}>

      {/* Chat Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-sidebar-border bg-sidebar-hover flex-shrink-0">
        <div className="flex items-center gap-2">
          <Bot size={16} className="text-white" />
          <span className="text-sm font-bold text-white">AI Assistant</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => createConversation(activeManuscript?.id)}
            title="New conversation"
            className="flex items-center gap-1 text-xs text-neutral-400 hover:text-white px-2 py-1 rounded hover:bg-sidebar-active transition-colors"
          >
            <Plus size={13} /> New Chat
          </button>
          <button
            onClick={() => setChatOpen(false)}
            className="w-7 h-7 flex items-center justify-center rounded text-neutral-400 hover:text-white hover:bg-sidebar-active transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Mode Selector */}
      <div className="flex gap-1 px-3 py-2 border-b border-sidebar-border flex-shrink-0">
        {MODES.map(mode => (
          <button
            key={mode.id}
            onClick={() => setActiveMode(mode.id)}
            className={`
              flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all
              ${activeMode === mode.id
                ? 'bg-brand text-white'
                : 'text-neutral-400 hover:bg-sidebar-hover hover:text-white'
              }
            `}
          >
            {mode.icon}
            {mode.label}
          </button>
        ))}

        {/* Model picker */}
        <div className="relative ml-auto">
          <button
            onClick={() => setShowModelPicker(!showModelPicker)}
            className="text-[10px] text-neutral-500 hover:text-neutral-300 px-1 py-1 rounded transition-colors truncate max-w-[60px]"
            title={selectedModel}
          >
            {selectedModel.split('/').pop()?.split(':')[0] ?? 'Model'}
          </button>
          {showModelPicker && (
            <div className="absolute bottom-8 right-0 bg-[#1f1f1f] border border-sidebar-border rounded-lg shadow-xl py-1 z-50 w-56 animate-slide-up">
              <p className="px-3 py-1 text-[10px] uppercase tracking-widest text-neutral-500 font-bold">Free Models</p>
              {FREE_MODELS.map(m => (
                <button
                  key={m.id}
                  onClick={() => {
                    setSetting('openrouter_model', m.id)
                    setShowModelPicker(false)
                  }}
                  className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                    selectedModel === m.id
                      ? 'text-white font-semibold'
                      : 'text-neutral-400 hover:text-white hover:bg-sidebar-hover'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chathead — still image by default, animated video while AI responds */}
      <div className="relative flex-shrink-0 border-b border-sidebar-border bg-gradient-to-b from-[#0d1117] to-[#1a1f2e]">
        <div className="relative w-full aspect-video overflow-hidden">
          {/* Still image — hidden while loading */}
          <img
            src="/chathead.jpeg"
            alt="AI Assistant"
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${isAILoading ? 'opacity-0' : 'opacity-100'}`}
          />
          {/* Animated video — shown while loading, looped */}
          <video
            ref={videoRef}
            src="/chathead.mp4"
            muted
            loop
            playsInline
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${isAILoading ? 'opacity-100' : 'opacity-0'}`}
          />
        </div>
        {/* Pulse ring at bottom to indicate activity */}
        <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-3 h-3 rounded-full border-2 border-sidebar-border bg-sidebar-bg transition-all duration-300 ${isAILoading ? 'scale-125 border-brand bg-brand/20' : ''}`}>
          <div className={`absolute inset-0 rounded-full transition-opacity duration-300 ${isAILoading ? 'opacity-100 animate-ping' : 'opacity-0'} bg-brand/40`} />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 allow-select min-h-0" style={{ minHeight: 200 }}>
        {aiMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full py-8 text-center">
            <Bot size={32} className="text-brand/40 mb-3" />
            <p className="text-sm text-white font-medium">How can I help you today?</p>
            <p className="text-xs text-neutral-400 mt-1 max-w-[200px]">
              {activeMode === 'write' && 'Ask me to improve a passage, suggest plot ideas, or help with dialogue.'}
              {activeMode === 'publish' && 'Ask about query letters, self-publishing, royalties, ISBN, or anything publishing.'}
              {activeMode === 'factcheck' && 'Describe a scene and ask "is this realistic?" or "would this actually happen?"'}
            </p>

            {/* Quick prompts */}
            <div className="mt-4 space-y-1.5 w-full px-2">
              {activeMode === 'write' && [
                'Suggest a stronger opening for this chapter',
                'How can I improve this dialogue?',
                'Help me fix the pacing in this scene',
              ].map(prompt => (
                <button
                  key={prompt}
                  onClick={() => { setInput(prompt); inputRef.current?.focus() }}
                  className="w-full text-left text-xs text-neutral-300 hover:text-white hover:bg-sidebar-hover px-3 py-2 rounded-lg border border-sidebar-border/50 transition-all"
                >
                  {prompt}
                </button>
              ))}
              {activeMode === 'publish' && [
                'How do I write a query letter?',
                'What is IngramSpark vs KDP?',
                'How do EPUB and PDF differ for ebooks?',
              ].map(prompt => (
                <button
                  key={prompt}
                  onClick={() => { setInput(prompt); inputRef.current?.focus() }}
                  className="w-full text-left text-xs text-neutral-300 hover:text-white hover:bg-sidebar-hover px-3 py-2 rounded-lg border border-sidebar-border/50 transition-all"
                >
                  {prompt}
                </button>
              ))}
              {activeMode === 'factcheck' && [
                'Is this how a police interrogation would go?',
                'Would a character realistically survive this?',
                'Is this medical scenario accurate?',
              ].map(prompt => (
                <button
                  key={prompt}
                  onClick={() => { setInput(prompt); inputRef.current?.focus() }}
                  className="w-full text-left text-xs text-neutral-300 hover:text-white hover:bg-sidebar-hover px-3 py-2 rounded-lg border border-sidebar-border/50 transition-all"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {aiMessages.map(msg => (
          <ChatMessage key={msg.id} message={msg} />
        ))}

        {/* Typing indicator */}
        {isAILoading && aiMessages.length > 0 && (
          aiMessages[aiMessages.length - 1].role !== 'assistant' && (
            <div className="flex gap-2 items-start">
              <div className="w-6 h-6 rounded-full bg-brand/20 flex items-center justify-center flex-shrink-0">
                <Bot size={12} className="text-brand" />
              </div>
              <div className="bg-sidebar-hover rounded-xl px-3 py-2.5 flex gap-1 items-center">
                <span className="typing-dot w-1.5 h-1.5 bg-sidebar-text rounded-full" />
                <span className="typing-dot w-1.5 h-1.5 bg-sidebar-text rounded-full" />
                <span className="typing-dot w-1.5 h-1.5 bg-sidebar-text rounded-full" />
              </div>
            </div>
          )
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex items-end gap-2 px-3 py-3 border-t border-sidebar-border flex-shrink-0">
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything…"
          rows={1}
          className="flex-1 bg-sidebar-hover text-white text-sm px-3 py-2 rounded-xl resize-none
            placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-brand/40
            allow-select transition-all"
          style={{ maxHeight: 120 }}
          onInput={(e) => {
            const t = e.target as HTMLTextAreaElement
            t.style.height = 'auto'
            t.style.height = `${Math.min(t.scrollHeight, 120)}px`
          }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isAILoading}
          className="w-9 h-9 flex items-center justify-center bg-brand hover:bg-brand-dark
            disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl
            transition-all flex-shrink-0 shadow-sm"
          title="Send (Enter)"
        >
          <Send size={15} />
        </button>
      </div>
    </div>
  )
}
