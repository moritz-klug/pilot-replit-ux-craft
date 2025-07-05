import { useCallback, useEffect, useRef, useState, useContext } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Wrench, Paperclip, Plus, Send } from "lucide-react"

import { cn } from "@/lib/utils"
import { Textarea } from "@/components/ui/textarea"
import { UITestModeContext } from "@/App"
import { Typewriter } from "@/components/ui/typewriter"

interface UseAutoResizeTextareaProps {
  minHeight: number
  maxHeight?: number
}

function useAutoResizeTextarea({
  minHeight,
  maxHeight,
}: UseAutoResizeTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const adjustHeight = useCallback(
    (reset?: boolean) => {
      const textarea = textareaRef.current
      if (!textarea) return

      if (reset) {
        textarea.style.height = `${minHeight}px`
        return
      }

      textarea.style.height = `${minHeight}px`
      const newHeight = Math.max(
        minHeight,
        Math.min(textarea.scrollHeight, maxHeight ?? Number.POSITIVE_INFINITY)
      )

      textarea.style.height = `${newHeight}px`
    },
    [minHeight, maxHeight]
  )

  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = `${minHeight}px`
    }
  }, [minHeight])

  useEffect(() => {
    const handleResize = () => adjustHeight()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [adjustHeight])

  return { textareaRef, adjustHeight }
}

const MIN_HEIGHT = 48
const MAX_HEIGHT = 164

const AnimatedPlaceholder = ({ showUITest }: { showUITest: boolean }) => (
  <div className="pointer-events-none text-sm absolute text-muted-foreground">
    {showUITest ? (
      <span>UI Test Mode ON</span>
    ) : (
      <Typewriter
        text={[
          "https://apple.com",
          "https://google.com",
          "https://github.com",
          "https://youtube.com",
          "https://netflix.com"
        ]}
        speed={60}
        waitTime={2000}
        deleteSpeed={40}
        showCursor={false}
        className="text-muted-foreground"
      />
    )}
  </div>
)

interface AiInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  disabled?: boolean
}

export function AiInput({ value, onChange, onSubmit, disabled }: AiInputProps) {
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: MIN_HEIGHT,
    maxHeight: MAX_HEIGHT,
  })
  const { uiTest, setUITest } = useContext(UITestModeContext)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handelClose = (e: any) => {
    e.preventDefault()
    e.stopPropagation()
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    setImagePreview(null)
  }

  const handelChange = (e: any) => {
    const file = e.target.files ? e.target.files[0] : null
    if (file) {
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = () => {
    if (!disabled && value.trim()) {
      onSubmit()
      adjustHeight(true)
    }
  }

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview)
      }
    }
  }, [imagePreview])

  return (
    <div className="w-full py-4">
      <div className="relative max-w-xl border rounded-[22px] border-border p-1 w-full mx-auto">
        <div className="relative rounded-2xl border border-border bg-card/50 flex flex-col shadow-lg">
          <div
            className="overflow-y-auto"
            style={{ maxHeight: `${MAX_HEIGHT}px` }}
          >
            <div className="relative">
              <Textarea
                value={value}
                placeholder=""
                className="w-full rounded-2xl rounded-b-none px-4 py-3 bg-card/50 border-none resize-none focus-visible:ring-0 leading-[1.2]"
                ref={textareaRef}
                disabled={disabled}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmit()
                  }
                }}
                onChange={(e) => {
                  onChange(e.target.value)
                  adjustHeight()
                }}
              />
              {!value && (
                <div className="absolute left-4 top-3">
                  <AnimatedPlaceholder showUITest={uiTest} />
                </div>
              )}
            </div>
          </div>

          <div className="h-12 bg-card/50 rounded-b-xl">
            <div className="absolute left-3 bottom-3 flex items-center gap-2">
              <label
                className={cn(
                  "cursor-pointer relative rounded-full p-2",
                  imagePreview
                    ? "bg-primary/15 border border-primary text-primary"
                    : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground"
                )}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handelChange}
                  className="hidden"
                  accept="image/*"
                />
                <Paperclip
                  className={cn(
                    "w-4 h-4 transition-colors",
                    imagePreview && "text-primary"
                  )}
                />
                {imagePreview && (
                  <div className="absolute w-[100px] h-[100px] top-14 -left-4">
                    <img
                      className="object-cover rounded-2xl w-full h-full"
                      src={imagePreview}
                      alt="Preview"
                    />
                    <button
                      onClick={handelClose}
                      className="bg-background border border-border absolute -top-1 -left-1 shadow-lg rounded-full rotate-45"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </label>
              <button
                type="button"
                onClick={() => {
                  setUITest(!uiTest)
                }}
                className={cn(
                  "rounded-full transition-all flex items-center gap-2 px-1.5 py-1 border h-8",
                  uiTest
                    ? "bg-orange-500/15 border-orange-500 text-orange-600"
                    : "bg-muted border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                  <motion.div
                    animate={{
                      rotate: uiTest ? 180 : 0,
                      scale: uiTest ? 1.1 : 1,
                    }}
                    whileHover={{
                      rotate: uiTest ? 180 : 15,
                      scale: 1.1,
                      transition: {
                        type: "spring",
                        stiffness: 300,
                        damping: 10,
                      },
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 260,
                      damping: 25,
                    }}
                  >
                    <Wrench
                      className={cn(
                        "w-4 h-4",
                        uiTest ? "text-orange-600" : "text-inherit"
                      )}
                    />
                  </motion.div>
                </div>
                <AnimatePresence>
                  {uiTest && (
                    <motion.span
                      initial={{ width: 0, opacity: 0 }}
                      animate={{
                        width: "auto",
                        opacity: 1,
                      }}
                      exit={{ width: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-sm overflow-hidden whitespace-nowrap text-orange-600 flex-shrink-0"
                    >
                      UI Test
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </div>
            <div className="absolute right-3 bottom-3">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={disabled || !value.trim()}
                className={cn(
                  "rounded-full p-2 transition-colors",
                  value.trim() && !disabled
                    ? "bg-primary/15 text-primary"
                    : "bg-muted text-muted-foreground"
                )}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}