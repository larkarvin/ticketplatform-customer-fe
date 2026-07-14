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
 */
export type RecoveryStep = 'ask' | 'sent' | 'listed' | 'expired'

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
      error.value = messageOf(e, t('recovery.error.codeWrong'))
      pending.value = false
      return
    }
    token.value = verified.token
    try {
      // The code was already accepted above — a failure here is a load problem, not a wrong code.
      items.value = await recoveryService.items(verified.token)
      step.value = 'listed'
    } catch (e) {
      error.value = messageOf(e, t('recovery.error.listFailed'))
    } finally {
      pending.value = false
    }
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
      if (statusOf(e) === 410) {
        // Genuine link, past its 30 minutes. The API masks the address for us, so we can resend.
        maskedEmail.value = maskedEmailOf(e)
        step.value = 'expired'
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
