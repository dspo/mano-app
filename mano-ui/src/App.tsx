import { IDELayout } from '@/components/ide/IDELayout'
import { Toaster } from '@/components/ui/sonner'
import { isTauri } from './lib/utils'

function App() {
  console.log('is tauri:', isTauri())
  return (
    <>
      <IDELayout />
      <Toaster />
    </>
  )
}

export default App
