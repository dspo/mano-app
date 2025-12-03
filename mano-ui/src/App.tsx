import { useState } from 'react'
import { Button } from '@/components/ui/button'

function App() {
  const [count, setCount] = useState(0)
  const [dark, setDark] = useState(false)

  return (
    <div className={(dark ? 'dark ' : '') + 'flex min-h-svh flex-col items-center justify-center gap-6 p-6'}>
      <h1 className="text-3xl font-bold">shadcn/ui + Tailwind v4</h1>
      <div className="flex gap-3">
        <Button>Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="link">Link</Button>
      </div>
      <Button onClick={() => setCount((c) => c + 1)}>count is {count}</Button>
      <div className="mt-4">
        <Button variant="outline" onClick={() => setDark((d) => !d)}>
          Toggle {dark ? 'Light' : 'Dark'}
        </Button>
      </div>
    </div>
  )
}

export default App
