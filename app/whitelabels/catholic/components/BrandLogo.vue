<!-- app/whitelabels/catholic/components/BrandLogo.vue -->
<!-- CatholicTickets brand mark: two fanned tickets (scalloped edges + dashed inner rectangles)
     with a gold halo floating above. Approved logo. Paired with a legible wordmark. Colours are
     the logo's own asset colours (black tickets, gold halo). -->
<script setup lang="ts"></script>

<template>
  <span class="flex items-center gap-2.5">
    <svg viewBox="16 16 182 192" class="h-10 w-auto shrink-0" aria-hidden="true">
      <defs>
        <g id="ct-tkt">
          <path
            d="M -28 -58 L 28 -58 A 12 12 0 0 0 40 -46 L 40 -9 A 9 9 0 0 0 40 9 L 40 46
               A 12 12 0 0 0 28 58 L -28 58 A 12 12 0 0 0 -40 46 L -40 9 A 9 9 0 0 0 -40 -9
               L -40 -46 A 12 12 0 0 0 -28 -58 Z"
            fill="#ffffff"
            stroke="#141414"
            stroke-width="5"
            stroke-linejoin="round"
          />
          <rect
            x="-18"
            y="-34"
            width="36"
            height="68"
            rx="6"
            fill="none"
            stroke="#141414"
            stroke-width="3"
            stroke-dasharray="6 6"
            stroke-linecap="round"
          />
        </g>
      </defs>
      <ellipse cx="120" cy="34" rx="58" ry="10" fill="none" stroke="#D9A521" stroke-width="6.5" />
      <use href="#ct-tkt" transform="translate(90,138) rotate(32)" />
      <use href="#ct-tkt" transform="translate(126,120) rotate(15)" />
    </svg>
    <span class="text-lg font-semibold" :style="{ color: 'var(--color-brand-500)' }">CatholicTickets</span>
  </span>
</template>
