<!-- app/whitelabels/catholic/components/BrandLogo.vue -->
<!-- CatholicTickets brand mark: a horizontal ticket in the brand token with a thin gold halo
     centred above it (a halo "over" the ticket, like a nimbus over a saint). Deliberately NOT a
     diagonal shaft — a tilted ticket with a loop at one end reads badly. No text inside; paired
     with a legible wordmark. Halo is a restrained gold ring (logo asset colour, reverent). -->
<script setup lang="ts"></script>

<template>
  <span class="flex items-center gap-2.5">
    <svg viewBox="0 0 56 36" class="h-9 w-auto shrink-0" aria-hidden="true">
      <!-- halo: thin gold ellipse centred above the ticket -->
      <ellipse cx="26" cy="7" rx="15" ry="3" fill="none" stroke="#D9A521" stroke-width="2" />
      <!-- horizontal ticket (brand-toned) -->
      <rect x="4" y="15" width="44" height="16" rx="3" fill="var(--color-brand-500)" />
      <!-- perforation + notches read as a tear line before the stub -->
      <line
        x1="37"
        y1="17"
        x2="37"
        y2="29"
        stroke="#ffffff"
        stroke-width="1.3"
        stroke-linecap="round"
        stroke-dasharray="1.5 1.9"
      />
      <circle cx="37" cy="15" r="2" fill="#ffffff" />
      <circle cx="37" cy="31" r="2" fill="#ffffff" />
    </svg>
    <span class="text-lg font-semibold" :style="{ color: 'var(--color-brand-500)' }">CatholicTickets</span>
  </span>
</template>
