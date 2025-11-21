import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { api } from '../lib/axios'
import { authStore } from '../store/auth'
import { NotificationToast } from '../components/ui/NotificationToast'

const NotificationsContext = createContext(null)

export function NotificationsProvider({ children }) {
  const [recentNotifications, setRecentNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isFetching, setIsFetching] = useState(false)
  const [toastNotification, setToastNotification] = useState(null)
  const [toastOpen, setToastOpen] = useState(false)
  const toastTimerRef = useRef(null)

  const knownIdsRef = useRef(new Set())
  const hasBootstrappedRef = useRef(false)
  const pollerRef = useRef(null)

  const triggerToast = useCallback((notification) => {
    if (!notification) {
      return
    }
    setToastNotification(notification)
    setToastOpen(true)

    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current)
    }

    toastTimerRef.current = setTimeout(() => {
      setToastOpen(false)
      toastTimerRef.current = null
    }, 5000)
  }, [])

  const normalizeList = (payload) => {
    if (Array.isArray(payload)) {
      return payload
    }
    return payload?.data ?? payload?.['hydra:member'] ?? payload?.member ?? []
  }

  const fetchRecentNotifications = useCallback(async () => {
    if (!authStore.isAuthenticated()) {
      setRecentNotifications([])
      setUnreadCount(0)
      hasBootstrappedRef.current = false
      knownIdsRef.current = new Set()
      return
    }

    try {
      setIsFetching(true)
      const [listResponse, countResponse] = await Promise.all([
        api.get('/notifications', { params: { limit: 10, page: 1 } }),
        api.get('/notifications/unread/count'),
      ])

      const list = normalizeList(listResponse.data)
      setRecentNotifications(list)
      setUnreadCount(countResponse.data?.count ?? 0)

      const known = knownIdsRef.current
      if (!hasBootstrappedRef.current) {
        list.forEach((item) => known.add(item.id))
        hasBootstrappedRef.current = true
        return
      }

      const fresh = list.filter((item) => item?.id && !known.has(item.id))
      fresh.forEach((item) => known.add(item.id))

      if (fresh.length > 0) {
        triggerToast(fresh[0])
      }
    } catch (error) {
      console.error('Erreur lors du chargement des notifications', error)
    } finally {
      setIsFetching(false)
    }
  }, [triggerToast])

  const markNotificationAsRead = useCallback(async (notificationId) => {
    if (!notificationId) return

    try {
      await api.post(`/notifications/${notificationId}/read`)
      setRecentNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId
            ? { ...notification, isRead: true }
            : notification
        )
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Impossible de marquer la notification comme lue', error)
      throw error
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    try {
      await api.post('/notifications/mark-all-read')
      setRecentNotifications((prev) =>
        prev.map((notification) => ({ ...notification, isRead: true }))
      )
      setUnreadCount(0)
    } catch (error) {
      console.error('Impossible de marquer toutes les notifications comme lues', error)
      throw error
    }
  }, [])

  useEffect(() => {
    fetchRecentNotifications()

    pollerRef.current = setInterval(fetchRecentNotifications, 60_000)

    return () => {
      if (pollerRef.current) {
        clearInterval(pollerRef.current)
      }
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current)
      }
    }
  }, [fetchRecentNotifications])

  const handleToastClose = useCallback(() => {
    setToastOpen(false)
  }, [])

  const contextValue = useMemo(
    () => ({
      recentNotifications,
      unreadCount,
      isFetching,
      refreshRecentNotifications: fetchRecentNotifications,
      markNotificationAsRead,
      markAllAsRead,
    }),
    [
      recentNotifications,
      unreadCount,
      isFetching,
      fetchRecentNotifications,
      markNotificationAsRead,
      markAllAsRead,
    ]
  )

  return (
    <NotificationsContext.Provider value={contextValue}>
      {children}
      <NotificationToast
        notification={toastNotification}
        open={toastOpen}
        onClose={handleToastClose}
      />
    </NotificationsContext.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext)
  if (!ctx) {
    throw new Error('useNotifications must be used within NotificationsProvider')
  }

  return ctx
}



