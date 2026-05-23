import { IMAGE_FILENAME, IMAGE_FORMAT_PREVIEW, IMAGE_FORMAT_THUMBNAIL, IMAGE_PATH_ORIGINAL, IMAGE_PATH_PREVIEW, IMAGE_PATH_THUMBNAIL, LINK_PIXIV_ARTWORK, LINK_PIXIV_USER, ONLINE_MODE, ONLINE_PXIMG } from '@/config'
import { ImageType } from '@/types'

const AI_TAG_ALIASES = new Set([
  'ai',
  'ai-assisted',
  'aiイラスト',
  'ai生成',
  'ai画作',
])

export function formatBytes(bytes: number) {
  if (bytes === 0)
    return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / k ** i).toFixed(2)} ${sizes[i]}`
}

export function formatTime(time: string) {
  if (time === '0000-00-00T00:00:00+09:00')
    return '未知'

  const date = new Date(time)
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const hour = date.getHours().toString().padStart(2, '0')
  const minute = date.getMinutes().toString().padStart(2, '0')
  const second = date.getSeconds().toString().padStart(2, '0')
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`
}

export function getImageUrl(image: Image, imageType: ImageType) {
  if (ONLINE_MODE && image.link) {
    switch (imageType) {
      case ImageType.Original:
        return image.link.original.replace('i.pximg.net', ONLINE_PXIMG)
      case ImageType.Preview:
        return image.link.preview.replace('i.pximg.net', ONLINE_PXIMG)
      case ImageType.Thumbnail:
        return image.link.thumbnail.replace('i.pximg.net', ONLINE_PXIMG)
    }
  }
  const filename = IMAGE_FILENAME
    .replace('{id}', image.id.toString())
    .replace('{part}', image.part.toString())
  let imagePath = ''
  let imageExt = ''
  switch (imageType) {
    case ImageType.Original:
      imagePath = IMAGE_PATH_ORIGINAL
      imageExt = image.ext
      break
    case ImageType.Preview:
      imagePath = IMAGE_PATH_PREVIEW
      imageExt = IMAGE_FORMAT_PREVIEW
      break
    case ImageType.Thumbnail:
      imagePath = IMAGE_PATH_THUMBNAIL
      imageExt = IMAGE_FORMAT_THUMBNAIL
      break
  }
  if (!imagePath.endsWith('/'))
    imagePath += '/'
  if (imageExt === '<ext>')
    imageExt = image.ext

  return imagePath + filename.replace('{ext}', imageExt)
}

export function openPixivIllust(pid: number) {
  window.open(LINK_PIXIV_ARTWORK.replace('{id}', pid.toString()), '_blank')
}

export function openPixivUser(uid: number) {
  window.open(LINK_PIXIV_USER.replace('{id}', uid.toString()), '_blank')
}

export function exportFile(data: string, filename = 'export-{ts}.json') {
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.replace('{ts}', Date.now().toString())
  a.click()
  URL.revokeObjectURL(url)
}

export function copyToClipboard(content: string | number) {
  navigator.clipboard.writeText(String(content))
}

export function hexToHSL(hex: string) {
  const color = normalizeHexColor(hex)
  const r = Number.parseInt(color.slice(0, 2), 16) / 255
  const g = Number.parseInt(color.slice(2, 4), 16) / 255
  const b = Number.parseInt(color.slice(4, 6), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      case b:
        h = (r - g) / d + 4
        break
    }
    h /= 6
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  }
}

function normalizeTagText(text: string | null | undefined) {
  return (text || '').trim().toLowerCase().replace(/\s+/g, '')
}

function normalizeHexColor(hex: string) {
  const value = hex.trim()
  const color = value.startsWith('#') ? value.slice(1) : value

  if (/^[\da-f]{3}$/i.test(color))
    return color.split('').map(char => char + char).join('')

  if (/^[\da-f]{6}$/i.test(color))
    return color

  return 'ffffff'
}

export function isGenericTag(tag: Tag | string) {
  const tagName = typeof tag === 'string' ? tag : tag.name
  return normalizeTagText(tagName).includes('users入り')
}

export function isAIArtwork(tags: Tag[]) {
  return tags.some(tag => AI_TAG_ALIASES.has(normalizeTagText(tag.name)) || AI_TAG_ALIASES.has(normalizeTagText(tag.translated_name)))
}

export function normalizeImages(images: Image[]): Image[] {
  return images.map(image => ({
    ...image,
    aiGenerated: isAIArtwork(image.tags),
  }))
}

export function transformData(illusts: any): Image[] {
  const result: Image[] = []
  for (const data of illusts) {
    if (data.page_count > 1) {
      for (let i = 0; i < data.page_count; i++) {
        result.push({
          id: data.id,
          part: i,
          title: data.title,
          size: [data.width, data.height],
          ext: 'jpg',
          author: {
            id: data.user.id,
            name: data.user.name,
            account: data.user.account,
          },
          tags: data.tags,
          created_at: data.create_date,
          sanity_level: data.sanity_level,
          x_restrict: data.x_restrict,
          bookmark: data.total_bookmarks,
          view: data.total_view,
          aiGenerated: false,
          dominant_color: '#FFF',
          link: {
            thumbnail: data.meta_pages[i].image_urls.medium,
            preview: data.meta_pages[i].image_urls.large,
            original: data.meta_pages[i].image_urls.original,
          },
        })
      }
    }
    else {
      result.push({
        id: data.id,
        part: 0,
        title: data.title,
        size: [data.width, data.height],
        ext: 'jpg',
        author: {
          id: data.user.id,
          name: data.user.name,
          account: data.user.account,
        },
        tags: data.tags,
        created_at: data.create_date,
        sanity_level: data.sanity_level,
        x_restrict: data.x_restrict,
        bookmark: data.total_bookmarks,
        view: data.total_view,
        aiGenerated: false,
        dominant_color: '#FFF',
        link: {
          thumbnail: data.image_urls.medium,
          preview: data.image_urls.large || data.meta_single_page.original_image_url,
          original: data.meta_single_page.original_image_url,
        },
      })
    }
  }
  return normalizeImages(result)
}
