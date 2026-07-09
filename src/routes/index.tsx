import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useRef, useState } from 'react'

export const Route = createFileRoute('/')({
  component: Home,
})

type Status = 'idle' | 'ready' | 'processing' | 'done' | 'error'

function Home() {
  const [status, setStatus] = useState<Status>('idle')
  const [fileName, setFileName] = useState<string>('')
  const [originalUrl, setOriginalUrl] = useState<string | null>(null)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [progress, setProgress] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const reset = useCallback(() => {
    setStatus('idle')
    setFileName('')
    setOriginalUrl(null)
    setResultUrl(null)
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
        progress: (key, current, total) => {
          const pct = total ? Math.round((current / total) * 100) : 0
          setProgress(
            key.startsWith('fetch')
              ? `Downloading model… ${pct}%`
              : `Processing… ${pct}%`,
          )
        },
      })
      setResultUrl(URL.createObjectURL(blob))
      setStatus('done')
    } catch (err) {
      console.error(err)
      setError('Something went wrong while removing the background.')
      setStatus('error')
    }
  }, [originalUrl])

  const downloadName = fileName
    ? fileName.replace(/\.[^.]+$/, '') + '-no-bg.png'
    : 'image-no-bg.png'

  const busy = status === 'processing'

  return (
    <main className="min-h-screen w-full bg-white text-black">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-5 py-10 sm:py-16">
        <header className="mb-10 text-center">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Background Remover
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm text-neutral-500">
            Upload an image and remove its background — right in your browser.
            Nothing is ever uploaded to a server.
          </p>
        </header>

        {/* Upload / preview area */}
        <div className="flex-1">
          {!originalUrl ? (
            <label
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
              className={`flex aspect-video w-full cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed transition-colors ${
                dragOver
                  ? 'border-black bg-neutral-50'
                  : 'border-neutral-300 hover:border-black hover:bg-neutral-50'
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
            </label>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <figure className="space-y-2">
                <figcaption className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Original
                </figcaption>
                <div className="checkerboard flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-neutral-200">
                  <img
                    src={originalUrl}
                    alt="Original"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              </figure>
              <figure className="space-y-2">
                <figcaption className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Result
                </figcaption>
                <div className="checkerboard flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-neutral-200">
                  {resultUrl ? (
                    <img
                      src={resultUrl}
                      alt="Background removed"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <span className="px-4 text-center text-xs text-neutral-500">
                      {busy ? progress || 'Working…' : 'Not processed yet'}
                    </span>
                  )}
                </div>
              </figure>
            </div>
          )}

          {error && (
            <p className="mt-4 text-center text-sm text-red-600">{error}</p>
          )}
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          {originalUrl && status !== 'done' && (
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

          {resultUrl && (
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
          Runs fully in your browser · Built with TanStack Start
        </footer>
      </div>
    </main>
  )
}
