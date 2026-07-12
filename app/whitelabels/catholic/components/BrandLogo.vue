<!-- app/whitelabels/catholic/components/BrandLogo.vue -->
<!-- CatholicTickets brand mark (from the founder's sketch): a diagonal ticket with a thin gold halo
     hovering over its raised end. No text inside the ticket. The ticket uses the brand token so it
     re-tints per deploy; the halo is a restrained gold ring (a logo asset colour — reverent, no
     glow/cartoon). Paired with a legible wordmark so the identity reads at any size. -->
<script setup lang="ts"></script>

<template>
  <span class="flex items-center gap-2.5">
    <svg viewBox="0 0 50 40" class="h-9 w-auto shrink-0" aria-hidden="true">
      <!-- halo: thin gold ellipse floating above the ticket's raised (upper-right) end -->
      <ellipse
        cx="37"
        cy="8"
        rx="8"
        ry="2.2"
        fill="none"
        stroke="#D9A521"
        stroke-width="2"
        transform="rotate(-22 37 8)"
      />
      <!-- diagonal ticket -->
      <g transform="rotate(-22 23 26.5)">
        <rect x="7" y="20" width="32" height="13" rx="3" fill="var(--color-brand-500)" />
        <!-- perforation + notches read as a tear line -->
        <line
          x1="30"
          y1="21.5"
          x2="30"
          y2="31.5"
          stroke="#ffffff"
          stroke-width="1.3"
          stroke-linecap="round"
          stroke-dasharray="1.4 1.8"
        />
        <circle cx="30" cy="20" r="2" fill="#ffffff" />
        <circle cx="30" cy="33" r="2" fill="#ffffff" />
      </g>
    </svg>
    <span class="text-lg font-semibold" :style="{ color: 'var(--color-brand-500)' }">CatholicTickets</span>
  </span>
</template>
