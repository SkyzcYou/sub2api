import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import AppSidebar from '../AppSidebar.vue'

const sidebarHarness = vi.hoisted(() => ({
  route: { path: '/dashboard' },
  router: { push: vi.fn() },
  appStore: {
    sidebarCollapsed: false,
    mobileOpen: false,
    sidebarScrollTop: 0,
    backendModeEnabled: false,
    siteName: 'Sub2API',
    siteLogo: '',
    siteVersion: 'test',
    publicSettingsLoaded: true,
    cachedPublicSettings: {
      custom_menu_items: [] as Array<Record<string, unknown>>,
    },
    toggleSidebar: vi.fn(),
    setMobileOpen: vi.fn(),
  },
  authStore: {
    isAdmin: false,
    isSimpleMode: false,
  },
  onboardingStore: {
    isCurrentStep: vi.fn(() => false),
    nextStep: vi.fn(),
  },
  adminSettingsStore: {
    opsMonitoringEnabled: true,
    paymentEnabled: true,
    customMenuItems: [] as Array<Record<string, unknown>>,
    fetch: vi.fn(),
  },
  batchImageAccess: { value: false },
  refreshBatchImageAccess: vi.fn().mockResolvedValue(false),
}))

vi.mock('@/stores', () => ({
  useAppStore: () => sidebarHarness.appStore,
  useAuthStore: () => sidebarHarness.authStore,
  useOnboardingStore: () => sidebarHarness.onboardingStore,
  useAdminSettingsStore: () => sidebarHarness.adminSettingsStore,
}))

vi.mock('vue-router', () => ({
  useRoute: () => sidebarHarness.route,
  useRouter: () => sidebarHarness.router,
}))

vi.mock('vue-i18n', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue-i18n')>()
  return {
    ...actual,
    useI18n: () => ({
      t: (key: string) => key,
    }),
  }
})

vi.mock('@/utils/featureFlags', () => ({
  FeatureFlags: {
    channelMonitor: {},
    payment: {},
    availableChannels: {},
    affiliate: {},
    riskControl: {},
  },
  makeSidebarFlag: () => () => true,
}))

vi.mock('@/composables/useBatchImageAccess', () => ({
  useBatchImageAccess: () => ({
    canUseBatchImage: sidebarHarness.batchImageAccess,
    refreshBatchImageAccess: sidebarHarness.refreshBatchImageAccess,
  }),
}))

const componentPath = resolve(dirname(fileURLToPath(import.meta.url)), '../AppSidebar.vue')
const componentSource = readFileSync(componentPath, 'utf8')
const stylePath = resolve(dirname(fileURLToPath(import.meta.url)), '../../../style.css')
const styleSource = readFileSync(stylePath, 'utf8')

describe('AppSidebar custom SVG styles', () => {
  it('does not override uploaded SVG fill or stroke colors', () => {
    expect(componentSource).toContain('.sidebar-svg-icon {')
    expect(componentSource).toContain('color: currentColor;')
    expect(componentSource).toContain('display: block;')
    expect(componentSource).not.toContain('stroke: currentColor;')
    expect(componentSource).not.toContain('fill: none;')
  })
})

describe('AppSidebar scroll position persistence', () => {
  it('binds a template ref to the sidebar nav element', () => {
    expect(componentSource).toContain('ref="sidebarNavRef"')
    expect(componentSource).toContain('sidebar-nav')
  })

  it('declares sidebarNavRef in script setup', () => {
    expect(componentSource).toContain("const sidebarNavRef = ref<HTMLElement | null>(null)")
  })

  it('saves scroll position on beforeUnmount', () => {
    expect(componentSource).toContain('onBeforeUnmount')
    expect(componentSource).toContain('appStore.sidebarScrollTop')
    expect(componentSource).toContain('sidebarNavRef.value.scrollTop')
  })

  it('restores scroll position on mount', () => {
    expect(componentSource).toContain('onMounted')
    expect(componentSource).toContain('appStore.sidebarScrollTop')
    expect(componentSource).toContain('nextTick')
  })
})

describe('AppSidebar header styles', () => {
  it('does not clip the version badge dropdown', () => {
    const sidebarHeaderBlockMatch = styleSource.match(/\.sidebar-header\s*\{[\s\S]*?\n {2}\}/)
    const sidebarBrandBlockMatch = componentSource.match(/\.sidebar-brand\s*\{[\s\S]*?\n\}/)

    expect(sidebarHeaderBlockMatch).not.toBeNull()
    expect(sidebarBrandBlockMatch).not.toBeNull()
    expect(sidebarHeaderBlockMatch?.[0]).not.toContain('@apply overflow-hidden;')
    expect(sidebarBrandBlockMatch?.[0]).not.toContain('overflow: hidden;')
  })
})

describe('AppSidebar regular user navigation', () => {
  beforeEach(() => {
    document.documentElement.classList.remove('dark')
    localStorage.setItem('theme', 'light')
    sidebarHarness.route.path = '/dashboard'
    sidebarHarness.appStore.sidebarCollapsed = false
    sidebarHarness.appStore.mobileOpen = false
    sidebarHarness.appStore.sidebarScrollTop = 0
    sidebarHarness.appStore.backendModeEnabled = false
    sidebarHarness.authStore.isAdmin = false
    sidebarHarness.authStore.isSimpleMode = false
    sidebarHarness.appStore.cachedPublicSettings.custom_menu_items = [
      {
        id: 'youziai-code-store',
        label: '卡网充值',
        icon_svg: '<svg viewBox="0 0 24 24"></svg>',
        url: 'https://catfk.com/shop/youziai',
        auth_mode: 'none',
        visibility: 'user',
        sort_order: 0,
      },
      {
        id: 'help',
        label: '帮助中心',
        icon_svg: '<svg viewBox="0 0 24 24"></svg>',
        url: 'https://example.com/help',
        visibility: 'user',
        sort_order: 100,
      },
    ]
    vi.clearAllMocks()
  })

  it('places USDT recharge and card recharge immediately after profile', async () => {
    const wrapper = mount(AppSidebar, {
      global: {
        stubs: {
          RouterLink: {
            props: ['to'],
            template: '<a :data-to="to"><slot /></a>',
          },
          VersionBadge: true,
        },
      },
    })

    await flushPromises()

    const links = wrapper.findAll('nav a.sidebar-link[data-to]')
    const paths = links.map((link) => link.attributes('data-to'))
    const profileIndex = paths.indexOf('/profile')

    expect(paths.slice(profileIndex, profileIndex + 5)).toEqual([
      '/profile',
      '/purchase',
      '/recharge/usdt',
      '/custom/youziai-code-store',
      '/custom/help',
    ])
    expect(links.at(profileIndex + 1)?.text()).toBe('nav.buySubscription')
    expect(links.at(profileIndex + 2)?.text()).toBe('nav.usdtRecharge')
    expect(links.at(profileIndex + 3)?.text()).toBe('卡网充值')
    const rechargeGroup = wrapper.get('nav .sidebar-recharge-group')
    expect(rechargeGroup.findAll('a.sidebar-recharge-link')).toHaveLength(3)
    expect(rechargeGroup.classes()).not.toContain('sidebar-link-active')
    expect(rechargeGroup.classes()).toContain('bg-gray-100/80')
    expect(rechargeGroup.classes()).toContain('dark:bg-dark-800/70')
    expect(links.at(profileIndex + 4)?.classes()).not.toContain('sidebar-recharge-link')
    expect(paths.filter((path) => path === '/custom/youziai-code-store')).toHaveLength(1)

    wrapper.unmount()
  })
})
