import { sanitizeUrl } from '@/utils/url'

export function updateFavicon(logoUrl: string): void {
  const sanitizedLogoUrl = sanitizeUrl(logoUrl, {
    allowRelative: true,
    allowDataUrl: true,
  }) || '/logo.svg'

  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
  if (!link) {
    link = document.createElement('link')
    link.rel = 'icon'
    document.head.appendChild(link)
  }

  const faviconMimeType = inferImageMimeType(sanitizedLogoUrl)
  if (faviconMimeType) {
    link.type = faviconMimeType
  } else {
    link.removeAttribute('type')
  }
  link.href = sanitizedLogoUrl
}

function inferImageMimeType(url: string): string {
  const dataUrlMatch = url.match(/^data:(image\/[a-z0-9.+-]+)[;,]/i)
  if (dataUrlMatch) {
    return dataUrlMatch[1].toLowerCase()
  }

  const path = url.split(/[?#]/, 1)[0].toLowerCase()
  switch (path.slice(path.lastIndexOf('.'))) {
    case '.svg':
      return 'image/svg+xml'
    case '.png':
      return 'image/png'
    case '.gif':
      return 'image/gif'
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg'
    case '.webp':
      return 'image/webp'
    case '.ico':
      return 'image/x-icon'
    default:
      return ''
  }
}
