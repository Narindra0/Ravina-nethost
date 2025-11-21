import React from 'react'
import { createRoute } from '@tanstack/react-router'
import { rootRoute } from './rootRoute'
import { authStore } from '../store/auth'

export const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    if (authStore.isAuthenticated()) {
      window.location.href = '/dashboard'
      throw new Error('Redirecting to dashboard')
    } else {
      window.location.href = '/login'
      throw new Error('Redirecting to login')
    }
  },
  component: () => null,
})