<!-- Social share buttons for the public event page. When the Web Share API is
     available (mobile browsers, mostly) we render a single native share button;
     otherwise we fall back to per-network share links + a copy-link button. -->
<template>
  <div class="flex flex-wrap items-center gap-2">
    <button
      v-if="canNativeShare"
      data-test="share-native"
      type="button"
      class="min-h-tap inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 text-sm font-medium dark:border-gray-700"
      @click="nativeShare"
    >
      <ExternalLink :size="18" />
      Share
    </button>
    <template v-else>
      <a
        v-for="l in links"
        :key="l.key"
        :data-test="`share-${l.key}`"
        :href="l.href"
        target="_blank"
        rel="noopener"
        class="min-h-tap inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700"
      >
        <ExternalLink :size="18" />
        {{ l.label }}
      </a>
      <button
        data-test="share-copy"
        type="button"
        class="min-h-tap inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700"
        @click="copy"
      >
        <component :is="copied ? Check : Link2" :size="18" />
        {{ copied ? 'Copied' : 'Copy link' }}
      </button>
    </template>
  </div>
</template>

<script setup lang="ts">
import { Check, ExternalLink, Link2 } from '#icons'
import { computed, ref } from 'vue'

const props = defineProps<{ url: string; title: string }>()

// navigator is only read in computed/handlers on the client; guard for SSR
// where `navigator` doesn't exist at all.
const canNativeShare = computed(() => typeof navigator !== 'undefined' && typeof navigator.share === 'function')

const links = computed(() => {
  const u = encodeURIComponent(props.url)
  const t = encodeURIComponent(props.title)
  return [
    { key: 'facebook', label: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
    { key: 'x', label: 'X', href: `https://twitter.com/intent/tweet?url=${u}&text=${t}` },
    { key: 'whatsapp', label: 'WhatsApp', href: `https://wa.me/?text=${t}%20${u}` },
  ]
})

const copied = ref(false)
async function copy(): Promise<void> {
  try {
    await navigator.clipboard.writeText(props.url)
    copied.value = true
    setTimeout(() => (copied.value = false), 1500)
  } catch {
    // clipboard blocked (permissions/insecure context) — silently no-op
  }
}

async function nativeShare(): Promise<void> {
  try {
    await navigator.share({ title: props.title, url: props.url })
  } catch {
    // user cancelled the share sheet — not an error
  }
}
</script>
