import { createFileRoute } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'

export const Route = createFileRoute('/')({
  component: Home,
})

type Status = 'idle' | 'ready' | 'processing' | 'done' | 'error'

// @imgly ships three model sizes. Labels are written for non-technical users.
type ModelId = 'isnet' | 'isnet_fp16' | 'isnet_quint8'

const MODELS: {
  id: ModelId
  label: string
  hint: string
}[] = [
  {
    id: 'isnet_quint8',
    label: 'Fast',
    hint: 'Smallest download, quickest — great for everyday photos',
  },
  {
    id: 'isnet_fp16',
    label: 'Balanced',
    hint: 'A good mix of speed and quality',
  },
  {
    id: 'isnet',
    label: 'Best quality',
    hint: 'Sharpest edges — larger download, slower',
  },
]

function Home() {
  const [status, setStatus] = useState<Status>('idle')
  const [fileName, setFileName] = useState<string>('')
  const [originalUrl, setOriginalUrl] = useState<string | null>(null)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [progress, setProgress] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [dragOver, setDragOver] = useState(false)
  const [model, setModel] = useState<ModelId>('isnet_quint8')
  const [resultModel, setResultModel] = useState<ModelId | null>(null)
  const [showToast, setShowToast] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Show a one-time notice explaining the first run is slower.
  useEffect(() => {
    try {
      if (!localStorage.getItem('bgr-seen-notice')) {
        setShowToast(true)
        localStorage.setItem('bgr-seen-notice', '1')
      }
    } catch {
      setShowToast(true)
    }
  }, [])

  useEffect(() => {
    if (!showToast) return
    const t = setTimeout(() => setShowToast(false), 8000)
    return () => clearTimeout(t)
  }, [showToast])

  const reset = useCallback(() => {
    setStatus('idle')
    setFileName('')
    setOriginalUrl(null)
    setResultUrl(null)
    setResultModel(null)
    setProgress('')
    setError('')
  }, [])

  const loadFile = useCallback((file: File | undefined | null) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.')
      setStatus('error')
      return
    }
    setError('')
    setResultUrl(null)
    setFileName(file.name)
    setOriginalUrl(URL.createObjectURL(file))
    setStatus('ready')
  }, [])

  const removeBackground = useCallback(async () => {
    if (!originalUrl) return
    setStatus('processing')
    setError('')
    setProgress('Loading model…')
    try {
      const { removeBackground } = await import('@imgly/background-removal')
      const blob = await removeBackground(originalUrl, {
        model,
        progress: (key, current, total) => {
          const pct = total ? Math.round((current / total) * 100) : 0
          setProgress(
            key.startsWith('fetch')
              ? `Downloading model… ${pct}%`
              : `Removing background… ${pct}%`,
          )
        },
      })
      setResultUrl(URL.createObjectURL(blob))
      setResultModel(model)
      setStatus('done')
    } catch (err) {
      console.error(err)
      setError('Something went wrong while removing the background.')
      setStatus('error')
    }
  }, [originalUrl, model])

  const downloadName = fileName
    ? fileName.replace(/\.[^.]+$/, '') + '-no-bg.png'
    : 'image-no-bg.png'

  const busy = status === 'processing'
  // A result is only "current" if it was produced by the selected model.
  const hasCurrentResult = !!resultUrl && resultModel === model

  return (
    <main className="min-h-screen w-full bg-white text-black">
      {/* First-load toast */}
      {showToast && (
        <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4">
          <div className="pointer-events-auto flex max-w-md items-start gap-3 rounded-xl border border-neutral-200 bg-black px-4 py-3 text-sm text-white shadow-lg">
            <span aria-hidden className="mt-0.5">
              ⏳
            </span>
            <p className="flex-1 leading-snug">
              The first background removal downloads a small AI model, so it may
              take a little longer. Every run after that is fast.
            </p>
            <button
              onClick={() => setShowToast(false)}
              className="text-neutral-400 transition-colors hover:text-white"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-5 py-10 sm:py-16">
        <header className="mb-10">
          <div className="mb-6 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2">
              <img src="https://res.cloudinary.com/dpcy2txus/image/upload/v1783636325/Screenshot_2026-07-10_033805-no-bg_1_lec8lu.png" alt="OpenBG logo" className="h-8 w-8" />
              <span className="text-lg font-semibold tracking-tight">
                OpenBG
              </span>
            </a>
            <a
              href="https://github.com/lokidotdev/openbg"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium text-black transition-colors hover:bg-neutral-50"
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden
                className="h-4 w-4"
                fill="currentColor"
              >
                <path d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58 0-.29-.01-1.04-.02-2.05-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5.99.11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.34-5.47-5.95 0-1.32.47-2.39 1.24-3.23-.13-.31-.54-1.53.11-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6.01 0c2.29-1.55 3.3-1.23 3.3-1.23.65 1.65.24 2.87.12 3.18.77.84 1.23 1.91 1.23 3.23 0 4.62-2.81 5.64-5.49 5.94.43.37.82 1.1.82 2.22 0 1.61-.02 2.9-.02 3.3 0 .32.22.7.83.58A12.01 12.01 0 0 0 24 12.5C24 5.87 18.63.5 12 .5Z" />
              </svg>
              Star on GitHub
            </a>
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Remove image backgrounds
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm text-neutral-500">
              A free, open source background remover that runs completely in your
              browser. Upload an image and remove its background — nothing is
              ever uploaded to a server.
            </p>
          </div>
        </header>

        {/* Upload / preview area */}
        <div className="flex-1">
          <motion.div
            layout
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className={`relative mx-auto w-full overflow-hidden rounded-2xl ${
              originalUrl
                ? 'checkerboard aspect-square max-w-md border border-neutral-200'
                : 'aspect-video border border-dashed border-neutral-300'
            }`}
          >
            <AnimatePresence mode="wait" initial={false}>
              {!originalUrl ? (
                <motion.label
                  key="dropzone"
                  initial={{ opacity: 0, scale: 0.97, filter: 'blur(6px)' }}
                  animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, scale: 0.97, filter: 'blur(6px)' }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  onDragOver={(e) => {
                    e.preventDefault()
                    setDragOver(true)
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault()
                    setDragOver(false)
                    loadFile(e.dataTransfer.files?.[0])
                  }}
                  className={`flex h-full w-full cursor-pointer flex-col items-center justify-center transition-colors ${
                    dragOver
                      ? 'bg-neutral-50'
                      : 'hover:border-black hover:bg-neutral-50'
                  }`}
                >
                  <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => loadFile(e.target.files?.[0])}
                  />
                  <svg
                    className="mb-4 h-8 w-8 text-neutral-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 16.5V9m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z"
                    />
                  </svg>
                  <span className="text-sm font-medium">Click to upload</span>
                  <span className="mt-1 text-xs text-neutral-500">
                    or drag and drop — PNG, JPG, WEBP
                  </span>
                </motion.label>
              ) : (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0, scale: 0.97, filter: 'blur(6px)' }}
                  animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, scale: 0.97, filter: 'blur(6px)' }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  className="relative flex h-full w-full items-center justify-center"
                >
                  <AnimatePresence mode="popLayout" initial={false}>
                    {hasCurrentResult ? (
                      <motion.img
                        key="result"
                        src={resultUrl!}
                        alt="Background removed"
                        initial={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, scale: 0.97, filter: 'blur(6px)' }}
                        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <motion.img
                        key="original"
                        src={originalUrl}
                        alt="Original"
                        initial={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
                        animate={{
                          opacity: 1,
                          scale: 1,
                          filter: busy ? 'blur(2px)' : 'blur(0px)',
                        }}
                        exit={{ opacity: 0, scale: 0.97, filter: 'blur(6px)' }}
                        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                        className="max-h-full max-w-full object-contain"
                      />
                    )}
                  </AnimatePresence>

                  <AnimatePresence>
                    {busy && (
                      <motion.div
                        key="overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-sm"
                      >
                        <div className="flex flex-col items-center gap-3 rounded-xl bg-black/80 px-5 py-4 text-white shadow-lg">
                          <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          <span className="text-xs font-medium">
                            {progress || 'Working…'}
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {error && (
            <p className="mt-4 text-center text-sm text-red-600">{error}</p>
          )}
        </div>

        {/* Model picker */}
        <div className="mx-auto mt-8 w-full max-w-xs">
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-neutral-500">
            Quality
          </label>
          <Select
            value={model}
            onValueChange={(v) => setModel(v as ModelId)}
            disabled={busy}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MODELS.map((m) => (
                <SelectItem key={m.id} value={m.id} description={m.hint}>
                  <span className="font-medium">{m.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          {originalUrl && !hasCurrentResult && (
            <button
              onClick={removeBackground}
              disabled={busy}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {busy && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              )}
              {busy ? progress || 'Removing…' : 'Remove background'}
            </button>
          )}

          {hasCurrentResult && (
            <a
              href={resultUrl}
              download={downloadName}
              className="inline-flex w-full items-center justify-center rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800 sm:w-auto"
            >
              Download PNG
            </a>
          )}

          {originalUrl && (
            <button
              onClick={reset}
              disabled={busy}
              className="inline-flex w-full items-center justify-center rounded-lg border border-neutral-300 px-5 py-2.5 text-sm font-medium text-black transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {status === 'done' ? 'Start over' : 'Choose another'}
            </button>
          )}
        </div>

        <footer className="mt-12 text-center text-xs text-neutral-400">
          OpenBG · Free & open source · Runs fully in your browser
        </footer>
      </div>
    </main>
  )
}
