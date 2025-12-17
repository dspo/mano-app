/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext } from 'react'

const ReadOnlyLockContext = createContext<boolean>(false)

export const ReadOnlyLockProvider = ReadOnlyLockContext.Provider

export function useReadOnlyLock() {
  return useContext(ReadOnlyLockContext)
}
