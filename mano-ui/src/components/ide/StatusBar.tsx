import { GitBranch, AlertCircle, Wifi } from 'lucide-react'

interface StatusBarProps {
  branch: string
  errors: number
  warnings: number
  line: number
  column: number
  language: string
}

export function StatusBar({ branch, errors, warnings, line, column, language }: StatusBarProps) {
  return (
    <div className="h-6 bg-primary text-primary-foreground flex items-center justify-between px-3 text-xs">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 hover:bg-primary-foreground/10 px-2 py-0.5 rounded cursor-pointer">
          <GitBranch className="w-3 h-3" />
          <span>{branch}</span>
        </div>
        
        <div className="flex items-center gap-3">
          {errors > 0 && (
            <div className="flex items-center gap-1 hover:bg-primary-foreground/10 px-2 py-0.5 rounded cursor-pointer">
              <AlertCircle className="w-3 h-3" />
              <span>{errors}</span>
            </div>
          )}
          {warnings > 0 && (
            <div className="flex items-center gap-1 hover:bg-primary-foreground/10 px-2 py-0.5 rounded cursor-pointer">
              <AlertCircle className="w-3 h-3" />
              <span>{warnings}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hover:bg-primary-foreground/10 px-2 py-0.5 rounded cursor-pointer">
          Ln {line}, Col {column}
        </div>
        <div className="hover:bg-primary-foreground/10 px-2 py-0.5 rounded cursor-pointer">
          UTF-8
        </div>
        <div className="hover:bg-primary-foreground/10 px-2 py-0.5 rounded cursor-pointer">
          {language}
        </div>
        <div className="hover:bg-primary-foreground/10 px-2 py-0.5 rounded cursor-pointer">
          LF
        </div>
        <div className="flex items-center gap-1 hover:bg-primary-foreground/10 px-2 py-0.5 rounded cursor-pointer">
          <Wifi className="w-3 h-3" />
        </div>
      </div>
    </div>
  )
}
