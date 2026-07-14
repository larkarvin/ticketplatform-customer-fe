// Owns the guest-recovery state machine: ask for an email → enter the code (or open the magic link)
// → list what that address owns. No transport (service) and no UI here.
//
// The honesty constraint that shapes this file: the API is enumeration-neutral. It answers the same
// 200 whether or not the address matched anything, and after three wrong codes `resend` still answers
// 200 while sending nothing. So this composable can NEVER know that an email was delivered, and must
// not pretend it does — it never surfaces the API's own "A fresh link is on its way." acknowledgement,
// and `restart()` always exists so the guest has a fresh way through.
import { isApiError, isValidationError } from '#core/errors'
import { useT } from '#core/i18n'
import { computed, onScopeDispose, ref } from 'vue'
import { recoveryService } from '../services/recovery.service'
import type { RecoveryExpiredResponse, RecoveryItem, RecoveryVerifyResponse } from '../types'

const RESEND_COOLDOWN_SECONDS = 60
const CODE_PATTERN = /^\d{6}$/

/**
 * `ask`     — collecting the email address (also where every dead end lands).
 * `sent`    — the request went through; we asked them to check their inbox. We do NOT know if
 *             anything was found or delivered, so nothing here may claim it was.
 * `listed`  — a valid token listed the address's orders/submissions.
 * `expired` — a genuine magic link that is past its 30 minutes; we know the masked address, so we
 *             can offer a one-tap resend without the guest retyping it.
 * `failed`  — the CHECK failed (offline, a dropped mobile connection, a 5xx, a 429), which tells us
 *             nothing about the token. It is very likely still valid, so we KEEP it and offer another
 *             attempt — never the "that link did not work" dead end, which would make the guest throw
 *             a live link away.
 */
export type RecoveryStep = 'ask' | 'sent' | 'listed' | 'expired' | 'failed'

/** Offline/5xx/429: the request never got a verdict on the token, so the token survives. */
function isTransient(status: number | undefined): boolean {
  return status === undefined || status === 429 || status >= 500
}

/** Errors rethrown untouched by the API client (429/410/…) still carry the raw transport shape. */
interface TransportError {
  statusCode?: number
  status?: number
  response?: { status?: number }
  data?: Partial<RecoveryExpiredResponse>
}

function statusOf(error: unknown): number | undefined {
  if (isValidationError(error)) return 422
  if (isApiError(error)) return error.status
  const err = error as TransportError | null
  return err?.response?.status ?? err?.statusCode ?? err?.status
}

function maskedEmailOf(error: unknown): string {
  const masked = (error as TransportError | null)?.data?.masked_email
  return typeof masked === 'string' ? masked : ''
}

export function useRecovery() {
  const { t } = useT()

  const step = ref<RecoveryStep>('ask')
  const email = ref('')
  const code = ref('')
  const items = ref<RecoveryItem[]>([])
  const maskedEmail = ref('')
  const error = ref('')
  const pending = ref(false)
  const cooldown = ref(0)

  // The listing token, once we hold one (from `verify`, or from the magic link). Kept so `resend`
  // can act without the guest retyping their address.
  const token = ref('')

  let timer: ReturnType<typeof setInterval> | null = null

  function stopCooldown(): void {
    if (timer) clearInterval(timer)
    timer = null
    cooldown.value = 0
  }

  function startCooldown(): void {
    if (timer) clearInterval(timer)
    cooldown.value = RESEND_COOLDOWN_SECONDS
    timer = setInterval(() => {
      cooldown.value -= 1
      if (cooldown.value <= 0) stopCooldown()
    }, 1000)
  }

  onScopeDispose(() => {
    if (timer) clearInterval(timer)
  })

  /**
   * One failure → one message. Our own API's failures arrive as ApiError/ValidationError and carry a
   * human message on `.message` (they have no `.data`); anything else rethrown by the client carries
   * only transport noise, so it gets plain-words copy instead.
   */
  function messageOf(cause: unknown, fallback: string): string {
    if (statusOf(cause) === 429) return t('recovery.error.tooMany')
    if (isValidationError(cause) || isApiError(cause)) return cause.message || fallback
    return fallback
  }

  /** Back to a clean first step — always reachable, because a resend may silently send nothing. */
  function restart(): void {
    step.value = 'ask'
    code.value = ''
    items.value = []
    maskedEmail.value = ''
    error.value = ''
    token.value = ''
    stopCooldown()
  }

  async function submitEmail(): Promise<void> {
    if (pending.value) return
    const address = email.value.trim()
    if (!address.includes('@')) {
      error.value = t('recovery.error.email')
      return
    }
    pending.value = true
    error.value = ''
    try {
      await recoveryService.request(address)
      email.value = address
      code.value = ''
      // Neutral by construction: we reach `sent` whether or not the address matched anything.
      step.value = 'sent'
      startCooldown()
    } catch (e) {
      error.value = messageOf(e, t('recovery.error.sendFailed'))
    } finally {
      pending.value = false
    }
  }

  async function submitCode(): Promise<void> {
    if (pending.value) return
    const entered = code.value.trim()
    if (!CODE_PATTERN.test(entered)) {
      error.value = t('recovery.error.code')
      return
    }
    pending.value = true
    error.value = ''
    let verified: RecoveryVerifyResponse
    try {
      verified = await recoveryService.verify(email.value, entered)
    } catch (e) {
      // Only a genuine verify() failure is "that code is not right" — this is the one path that may say it.
      error.value = messageOf(e, t('recovery.error.codeWrong'))
      pending.value = false
      return
    }
    // The 6-digit code is single-use: verify() just CONSUMED it. Listing the orders is now the exact same
    // job the magic link does, so hand it to loadItems — one shared "load the list, transient vs invalid"
    // path. A transient failure there lands on `failed` (whose Try again re-lists with the retained token),
    // never back on this code field, where re-submitting the spent code would be told it is "wrong" and
    // burn the guest's remaining attempts on a code that already worked. Release `pending` first so
    // loadItems' own re-entrancy guard does not short-circuit the delegated call.
    pending.value = false
    await loadItems(verified.token)
  }

  /** Entry point for the magic link: `/recover/{token}` hands us a token straight from the email. */
  async function loadItems(magicToken: string): Promise<void> {
    if (pending.value) return
    pending.value = true
    error.value = ''
    token.value = magicToken
    try {
      items.value = await recoveryService.items(magicToken)
      step.value = 'listed'
    } catch (e) {
      const status = statusOf(e)
      if (status === 410) {
        // Genuine link, past its 30 minutes. The API masks the address for us, so we can resend.
        maskedEmail.value = maskedEmailOf(e)
        step.value = 'expired'
        return
      }
      if (isTransient(status)) {
        // We never heard back about the token, so we must not condemn it: keep it (it may well have
        // 25 minutes left) and let the page offer another attempt. A 429 says "wait", not "broken".
        // Empty fallback on purpose: the `failed` screen's own body copy already says this in calm
        // words, so the red alert line below it should only appear when there is something MORE
        // specific to say — a 429's "wait a minute", which messageOf() returns regardless of fallback.
        error.value = messageOf(e, '')
        // A 429 also means "Try again" would walk straight back into the same throttle: reuse the
        // resend cooldown so the page can disable it until the wait is over.
        if (status === 429) startCooldown()
        step.value = 'failed'
        return
      }
      // Tampered/unknown token: it names nobody, so the only way on is a fresh request.
      token.value = ''
      step.value = 'ask'
      error.value = messageOf(e, t('recovery.error.linkInvalid'))
    } finally {
      pending.value = false
    }
  }

  /**
   * Send another code+link. With a token (the expired-link page) the address rides inside it; without
   * one we re-run the original request. Either way the API answers neutrally, so we never tell the
   * guest the mail is "on its way" — the page's copy has to stay a suggestion to check the inbox.
   */
  async function resend(): Promise<void> {
    if (pending.value || cooldown.value > 0) return
    if (!token.value && !email.value) {
      restart()
      return
    }
    pending.value = true
    error.value = ''
    try {
      if (token.value) await recoveryService.resend(token.value)
      else await recoveryService.request(email.value)
      startCooldown()
    } catch (e) {
      error.value = messageOf(e, t('recovery.error.sendFailed'))
    } finally {
      pending.value = false
    }
  }

  return {
    step,
    // Exposed so a transient failure can be retried with the SAME token instead of discarding it.
    token,
    email,
    code,
    items,
    maskedEmail,
    error,
    pending,
    cooldown,
    canResend: computed(() => cooldown.value === 0 && !pending.value),
    submitEmail,
    submitCode,
    resend,
    loadItems,
    restart,
  }
}
