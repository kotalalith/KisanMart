'use client'

import { createContext, useContext, useState, useMemo } from 'react'

const RoleContext = createContext(undefined)

export function RoleProvider({ children }) {
  const [role, setRole] = useState('buyer')

  const value = useMemo(() => ({ role, setRole }), [role])

  return (
    <RoleContext.Provider value={value}>
      {children}
    </RoleContext.Provider>
  )
}

export function useRole() {
  const context = useContext(RoleContext)
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider')
  }
  return context
}






