import { useCallback } from 'react'
import { router } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { Platform } from 'react-native'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, apiBody, post } from '@/lib/api'
import { useAuth } from '@/providers/auth-provider'
import type {
  DraftSummary, HomeData, LegalDoc, ListingDetail, ListingPage, Me, NotificationItem, Profile, Referral, SavedItem,
  ToolForm, ToolSummary, TopicDetail, TopicSummary,
} from '@/lib/types'
import { setBadge } from '@/lib/push'

export function useNotifications() {
  const { status } = useAuth()
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const body = await apiBody<{ data: NotificationItem[]; unread: number }>('/notifications')
      setBadge(body.unread)
      return body
    },
    enabled: status === 'authenticated',
    refetchInterval: 2 * 60_000, // pick up new notices while the app is open
  })
}

export function useMarkRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (arg: { id: string } | { all: true }) => api<{ unread: number }>('/notifications', { method: 'PATCH', body: JSON.stringify(arg) }),
    onMutate: (arg) => {
      qc.setQueryData<{ data: NotificationItem[]; unread: number }>(['notifications'], (prev) => {
        if (!prev) return prev
        const data = prev.data.map((n) => ('all' in arg || n.id === arg.id ? { ...n, read: true } : n))
        return { data, unread: data.filter((n) => !n.read).length }
      })
    },
    onSuccess: (res) => {
      setBadge(res.unread)
      qc.setQueryData<Me>(['me'], (m) => (m ? { ...m, unreadNotifications: res.unread } : m))
      qc.invalidateQueries({ queryKey: ['me', 'home'] })
    },
  })
}

export function useProfile() {
  const { status } = useAuth()
  return useQuery({ queryKey: ['profile'], queryFn: () => api<Profile>('/me/profile'), enabled: status === 'authenticated' })
}

export function useReferral() {
  const { status } = useAuth()
  return useQuery({ queryKey: ['referral'], queryFn: () => api<Referral>('/me/referral'), enabled: status === 'authenticated', staleTime: 10 * 60_000 })
}

export function useToolList() {
  return useQuery({ queryKey: ['tools'], queryFn: () => api<{ writing: ToolSummary[]; launchpad: ToolSummary[] }>('/tools'), staleTime: 60 * 60_000 })
}

export function useToolForm(tool: string, opts: { draft?: string; opportunity?: string }) {
  const { status } = useAuth()
  const sp = new URLSearchParams()
  if (opts.draft) sp.set('draft', opts.draft)
  if (opts.opportunity) sp.set('opportunity', opts.opportunity)
  return useQuery({
    queryKey: ['tool', tool, opts.draft ?? null, opts.opportunity ?? null],
    queryFn: () => api<ToolForm>(`/tools/${tool}${sp.size ? `?${sp}` : ''}`),
    enabled: status === 'authenticated',
    staleTime: 0,
  })
}

export function useDrafts() {
  const { status } = useAuth()
  return useQuery({ queryKey: ['drafts'], queryFn: () => api<DraftSummary[]>('/drafts'), enabled: status === 'authenticated' })
}

export function useLegal(kind: 'terms' | 'privacy') {
  return useQuery({ queryKey: ['legal', kind], queryFn: () => api<LegalDoc>(`/legal/${kind}`, {}, { auth: false }), staleTime: 24 * 60 * 60_000 })
}

export function useHome() {
  const { status } = useAuth()
  return useQuery({ queryKey: ['me', 'home'], queryFn: () => api<HomeData>('/me/home'), enabled: status === 'authenticated' })
}

export function useMe() {
  const { status } = useAuth()
  return useQuery({ queryKey: ['me'], queryFn: () => api<Me>('/me'), enabled: status === 'authenticated' })
}

export interface ListingQuery { q?: string; level?: string; funded?: boolean; soon?: number; topic?: string; category?: string }

export function useListings(filters: ListingQuery) {
  return useInfiniteQuery({
    queryKey: ['listings', filters],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => {
      const sp = new URLSearchParams({ page: String(pageParam), pageSize: '20' })
      if (filters.q?.trim()) sp.set('q', filters.q.trim())
      if (filters.level) sp.set('level', filters.level)
      if (filters.funded) sp.set('funded', '1')
      if (filters.soon) sp.set('soon', String(filters.soon))
      if (filters.topic) sp.set('topic', filters.topic)
      if (filters.category) sp.set('category', filters.category)
      return apiBody<ListingPage>(`/opportunities?${sp}`)
    },
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
  })
}

export function useListing(id: string) {
  return useQuery({ queryKey: ['listing', id], queryFn: () => api<ListingDetail>(`/opportunities/${id}`) })
}

export function useTopics() {
  return useQuery({ queryKey: ['topics'], queryFn: () => api<TopicSummary[]>('/topics'), staleTime: 5 * 60_000 })
}

export function useTopic(slug: string) {
  return useQuery({ queryKey: ['topic', slug], queryFn: () => api<TopicDetail>(`/topics/${slug}`) })
}

export function useSaved() {
  const { status } = useAuth()
  return useQuery({ queryKey: ['saved'], queryFn: () => api<SavedItem[]>('/saved'), enabled: status === 'authenticated' })
}

/**
 * Save / unsave one listing. Updates the saved list straight away (optimistic),
 * rolls back if the server refuses, and sends guests to sign in.
 */
export function useSaveToggle(id: string) {
  const { status } = useAuth()
  const qc = useQueryClient()
  const saved = useSaved()
  const isSaved = saved.data ? saved.data.some((s) => s.id === id) : undefined

  const mutation = useMutation({
    mutationFn: (next: boolean) =>
      next ? api('/saved', post({ opportunityId: id })) : api(`/saved?opportunityId=${id}`, { method: 'DELETE' }),
    onMutate: async (next: boolean) => {
      await qc.cancelQueries({ queryKey: ['saved'] })
      const prev = qc.getQueryData<SavedItem[]>(['saved'])
      if (prev) {
        const listing = qc.getQueryData<ListingDetail>(['listing', id])
        qc.setQueryData<SavedItem[]>(['saved'], next
          ? [...prev, ...(listing ? [{ ...listing, savedAt: new Date().toISOString() }] : [])]
          : prev.filter((s) => s.id !== id))
      }
      qc.setQueryData<ListingDetail>(['listing', id], (d) => (d ? { ...d, saved: next } : d))
      return { prev }
    },
    onError: (_e, _next, ctx) => {
      if (ctx?.prev) qc.setQueryData(['saved'], ctx.prev)
      qc.invalidateQueries({ queryKey: ['listing', id] })
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['saved'] })
      qc.invalidateQueries({ queryKey: ['me', 'home'] })
    },
  })

  const toggle = useCallback(() => {
    if (status !== 'authenticated') {
      router.push('/sign-in')
      return
    }
    if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {})
    const current = isSaved ?? qc.getQueryData<ListingDetail>(['listing', id])?.saved ?? false
    mutation.mutate(!current)
  }, [status, isSaved, qc, id, mutation])

  return { saved: isSaved, toggle, pending: mutation.isPending, error: mutation.error }
}
