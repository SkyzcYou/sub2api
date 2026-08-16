import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

import CustomPageView from '../CustomPageView.vue'

const { appStore, authStore, adminSettingsStore, route } = vi.hoisted(() => ({
  appStore: {
    cachedPublicSettings: { custom_menu_items: [] } as {
      custom_menu_items: Array<Record<string, unknown>>
    },
    publicSettingsLoaded: true,
    fetchPublicSettings: vi.fn(),
  },
  authStore: {
    isAdmin: false,
    user: { id: 42 },
    token: 'session-token',
  },
  adminSettingsStore: {
    customMenuItems: [] as Array<Record<string, unknown>>,
  },
  route: {
    params: { id: 'store' },
  },
}))

vi.mock('@/stores', () => ({
  useAppStore: () => appStore,
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => authStore,
}))

vi.mock('@/stores/adminSettings', () => ({
  useAdminSettingsStore: () => adminSettingsStore,
}))

vi.mock('vue-router', () => ({
  useRoute: () => route,
}))

vi.mock('vue-i18n', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue-i18n')>()
  const { ref } = await import('vue')
  return {
    ...actual,
    useI18n: () => ({
      t: (key: string) => key,
      locale: ref('zh'),
    }),
  }
})

function mountView(authMode?: 'none' | 'query') {
  appStore.cachedPublicSettings.custom_menu_items = [
    {
      id: 'store',
      label: '兑换码商城',
      icon_svg: '',
      url: 'https://catfk.com/shop/youziai?campaign=test',
      ...(authMode ? { auth_mode: authMode } : {}),
      visibility: 'user',
      sort_order: 0,
    },
  ]

  return mount(CustomPageView, {
    global: {
      stubs: {
        AppLayout: { template: '<div><slot /></div>' },
        Icon: { template: '<span />' },
      },
    },
  })
}

describe('CustomPageView identity forwarding', () => {
  beforeEach(() => {
    document.documentElement.classList.remove('dark')
    appStore.publicSettingsLoaded = true
    appStore.fetchPublicSettings.mockClear()
    authStore.user = { id: 42 }
    authStore.token = 'session-token'
  })

  it('does not expose user identity to a third-party page in none mode', async () => {
    const wrapper = mountView('none')
    await flushPromises()

    const iframeURL = new URL(wrapper.get('iframe').attributes('src'))
    const externalLinkURL = new URL(wrapper.get('a[target="_blank"]').attributes('href'))

    expect(iframeURL.origin).toBe('https://catfk.com')
    expect(iframeURL.pathname).toBe('/shop/youziai')
    expect(iframeURL.searchParams.get('campaign')).toBe('test')
    expect(iframeURL.searchParams.has('user_id')).toBe(false)
    expect(iframeURL.searchParams.has('token')).toBe(false)
    expect(iframeURL.searchParams.get('ui_mode')).toBe('embedded')
    expect(externalLinkURL.toString()).toBe(iframeURL.toString())
  })

  it('keeps legacy query forwarding when auth_mode is absent', async () => {
    const wrapper = mountView()
    await flushPromises()

    const iframeURL = new URL(wrapper.get('iframe').attributes('src'))
    expect(iframeURL.searchParams.get('user_id')).toBe('42')
    expect(iframeURL.searchParams.get('token')).toBe('session-token')
  })
})
