import React from 'react'
import { Outlet, createRootRoute } from '@tanstack/react-router'

export const rootRoute = createRootRoute({
  component: () => {
    return (
      <div style={{ fontFamily: 'sans-serif' }}>
        <Outlet />
      </div>
    )
  },
})