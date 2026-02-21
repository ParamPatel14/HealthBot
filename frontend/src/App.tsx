import { useEffect, useState } from 'react'
import './App.css'

type BackendState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; message: string }
  | { status: 'error'; message: string }

function App() {
  const [backend, setBackend] = useState<BackendState>({ status: 'idle' })

  useEffect(() => {
    let isCancelled = false

    const loadMessage = async () => {
      setBackend({ status: 'loading' })

      try {
        const response = await fetch('http://localhost:8000/api/message')

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`)
        }

        const data: { message?: string } = await response.json()

        if (!isCancelled) {
          setBackend({
            status: 'success',
            message: data.message ?? 'Backend is running',
          })
        }
      } catch (error) {
        if (!isCancelled) {
          setBackend({
            status: 'error',
            message:
              error instanceof Error ? error.message : 'Unable to reach backend',
          })
        }
      }
    }

    loadMessage()

    return () => {
      isCancelled = true
    }
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-50">
      <div className="max-w-md w-full px-6 py-8 rounded-2xl bg-slate-800 shadow-lg border border-slate-700">
        <h1 className="text-3xl font-bold mb-4 text-center">HealthBot</h1>
        <p className="text-slate-300 mb-6 text-center">
          Simple check to see if the backend and Tailwind CSS are working.
        </p>

        <div className="space-y-3">
          <div className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Backend status
          </div>

          {backend.status === 'idle' && (
            <div className="rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-slate-200">
              Waiting to contact backend...
            </div>
          )}

          {backend.status === 'loading' && (
            <div className="rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-slate-200">
              Contacting backend...
            </div>
          )}

          {backend.status === 'success' && (
            <div className="rounded-lg border border-emerald-500/70 bg-emerald-500/10 px-4 py-3 text-emerald-200">
              {backend.message}
            </div>
          )}

          {backend.status === 'error' && (
            <div className="rounded-lg border border-red-500/70 bg-red-500/10 px-4 py-3 text-red-200">
              {backend.message}
            </div>
          )}
        </div>

        <p className="mt-6 text-xs text-slate-500 text-center">
          Tailwind utilities are used for this layout and styling.
        </p>
      </div>
    </div>
  )
}

export default App
