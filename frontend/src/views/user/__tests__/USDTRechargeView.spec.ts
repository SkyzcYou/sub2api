import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import USDTRechargeView from '../USDTRechargeView.vue'

vi.mock('vue-i18n', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue-i18n')>()
  const messages: Record<string, string> = {
    'usdtRecharge.title': 'USDT 充值',
    'usdtRecharge.maintenance': '维护中...',
  }

  return {
    ...actual,
    useI18n: () => ({
      t: (key: string) => messages[key] ?? key,
    }),
  }
})

describe('USDTRechargeView', () => {
  it('renders the maintenance state without embedding an external page', () => {
    const wrapper = mount(USDTRechargeView, {
      global: {
        stubs: {
          AppLayout: { template: '<main><slot /></main>' },
        },
      },
    })

    expect(wrapper.get('h1').text()).toBe('USDT 充值')
    expect(wrapper.get('[role="status"]').text()).toBe('维护中...')
    expect(wrapper.find('iframe').exists()).toBe(false)
  })
})
