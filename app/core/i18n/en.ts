import type { MessageTree } from '#core/i18n'

// customer-fe's own English catalog, layered over the fe-core base at boot (app/plugins/i18n.ts).
// {person}/{people} placeholders are filled from the deploy-configured person term. Keys grow as
// the app's copy is extracted; covers checkout, the order hub, and public forms.
export const en: MessageTree = {
  common: {
    total: 'Total',
    updating: 'Updating…',
    retry: 'Retry',
    edit: 'Edit',
    remove: 'Remove',
    change: 'Change',
    done: 'Done',
    pay: 'Pay',
    yourTickets: 'Your tickets',
    optionalExtras: 'Optional extras',
    genericError: 'Something went wrong. Please try again.',
  },
  checkout: {
    person: {
      title: '{person} {n}',
      add: 'Add {person}',
      laterSummary: "{count} {people} — you'll add names after payment",
    },
    group: {
      collapse: 'Collapse {name}',
      expand: 'Expand {name}',
      removeTicket: 'Remove this ticket',
      badge: {
        ready: 'Ready',
        allReady: 'All ready',
        needsDetails: 'Needs details',
        progress: '{done} of {total} ready',
      },
    },
    card: {
      collapse: 'Collapse {title}',
      expand: 'Expand {title}',
      complete: 'Complete',
      missing: '{n} to add',
      copyFromAbove: 'Copy from above',
    },
    attendees: {
      heading: "Who's attending",
      needsDetailsOne: 'Please finish the required details for 1 person below.',
      needsDetailsMany: 'Please finish the required details for {count} people below.',
    },
    addOns: {
      heading: 'Optional extras',
      hint: "Add only what you'd like.",
    },
    breakdown: {
      title: 'Order summary',
      total: 'Total',
      empty: 'No items yet.',
    },
    payBar: {
      updateFailed: "Couldn't update total",
      continueToReview: 'Continue to review',
      redirecting: 'Taking you to secure payment…',
      pay: 'Pay {total}',
    },
    review: {
      heading: 'Review your order',
      whoComing: "Who's coming",
      participantLabel: '{person} {n}',
      laterSummary: '{count} {people} — names added after payment',
      emailLabel: 'Send my receipt to',
      emailHint: "This is where we'll email your order confirmation.",
      emailPlaceholder: 'you@example.com',
    },
    email: {
      required: 'Please enter your email so we can send your receipt.',
      invalid: 'Please enter a valid email address.',
    },
  },
  orderHub: {
    orderLabel: 'Order',
    pageTitleFallback: 'Order status',
    subtotalLabel: 'Subtotal',
    totalLabel: 'Total:',
    sourceLinkPrefix: 'For',
    redirecting: 'Redirecting…',
    rebuildButton: 'Rebuild my order',
    cancelButton: 'Cancel this order',
    resendLinkButton: 'Email me this order link',
    cancelConfirm: 'This releases your tickets — you’ll need to start over to get them back. Cancel?',
    processing: {
      heading: 'Confirming your payment…',
      body: "This usually takes just a moment. Please don't close this page.",
    },
    paid: {
      heading: "You're in!",
      body: 'A receipt has been emailed to you.',
      on: 'Paid {date} ·',
      paymentRefLabel: 'Payment ref',
    },
    receipt: {
      button: 'Resend receipt',
      sending: 'Sending…',
      error: "We couldn't resend the receipt just now — please try again.",
    },
    awaiting: {
      heading: 'Your order is reserved',
      heldFor: 'Held for',
      until: 'until',
      completePayment: 'Complete payment to confirm your spot.',
      resumeButton: 'Resume payment',
    },
    failed: {
      heading: "That payment didn't go through",
      body: 'No charge was made. You can try again below.',
    },
    expired: {
      heading: 'This reservation expired',
      body: "Your spot was released. You're welcome to start a new order.",
    },
    cancelled: {
      heading: 'This order was cancelled',
      body: 'Your tickets were released. You can start a new order any time.',
    },
    fetchError: {
      heading: "We couldn't load your order",
      body: 'Check your connection and try again — your order and any payment are safe.',
    },
    attendees: {
      heading: "Who's attending?",
      hint: 'Add the details for everyone coming.',
      saveButton: 'Save {person} details',
      saved: '{person} details saved',
    },
    tickets: {
      hint: 'Show these at the door for check-in.',
      qrAlt: 'Ticket QR for {person} #{id}',
    },
  },
  forms: {
    review: {
      stepTitle: 'Review',
      defaultSectionTitle: 'Your answers',
      emailLabel: 'Send my confirmation to',
      emailHint: "This is where we'll send a copy of your submission.",
      emailHintPriced: "This is where we'll send a copy of your submission and your order receipt.",
      emailPlaceholder: 'your@email.com',
    },
    redirecting: {
      heading: 'One moment…',
      body: 'Taking you to your order.',
    },
    requiredHint: {
      prefix: 'Questions marked',
      suffix: 'need an answer.',
    },
    closed: "This form is closed. It's no longer taking responses.",
    membersOnly: 'This form is just for members.',
    step: 'Step {n}',
    stepper: {
      of: 'of {total}',
      next: 'Next: {title}',
    },
    calculating: 'Working out your total…',
    continueButton: 'Continue',
    submitDefault: 'Submit',
    submitting: 'Submitting…',
    pay: 'Pay {currency} {amount}',
    uploadedLabel: 'Uploaded',
    submitError: "Couldn't submit your response. Please try again.",
    email: {
      invalid: 'Enter a valid email address',
    },
    product: {
      noOptions: 'No options available.',
      chooseNamed: 'Choose {names}',
      chooseGeneric: 'Choose options',
      editSelection: 'Edit selection',
      viewImageAlt: 'View image of {name}',
      genericImageAlt: 'Image',
      fromPrice: 'From {currency} {amount}',
      totalOf: 'Total: {qty} of {max}',
    },
    quantity: {
      decreaseAria: 'Decrease quantity for {label}',
      increaseAria: 'Increase quantity for {label}',
      valueAria: 'Quantity for {label}',
    },
  },
  recovery: {
    // The API never tells us whether an address was found, so none of this copy may claim it was.
    // Two honesty rules shape every string here:
    //   1. The request endpoint answers identically for a known and an unknown address, so the page
    //      may only ever say "IF we have anything for that address…" — never "we found your orders".
    //   2. After three wrong codes, `resend` still answers 200 and sends nothing at all. So no string
    //      here may promise a delivery ("a fresh link is on its way"), and `startOver` — a genuinely
    //      new request, the only real way out of that dead end — is always on screen.
    pageTitle: 'Find my order',
    heading: 'Find my order',
    intro:
      "Enter the email address you used when you booked. If we have anything for it, we'll email you a link to it.",
    emailLabel: 'Your email address',
    emailHint: 'Use the address your confirmation was sent to.',
    submit: 'Email me my link',
    sentHeading: 'Check your email',
    sentBody:
      "If we have anything for {email}, we've sent an email to it. The email has a button that opens your orders — and a 6-digit code you can type in below instead.",
    sentNothingArrived:
      'Nothing yet? Give it a minute, then look in your junk or spam folder. If the address above is wrong, start over below.',
    codeLabel: 'Enter the 6-digit code',
    codeHint: 'The code is in that email, under the button. It works for 30 minutes.',
    codeSubmit: 'Continue',
    resend: 'Send another email',
    resendIn: 'You can send another email in {seconds}s',
    startOver: 'Start over with a different email address',
    // /recover/{token} — the three outcomes of opening the button in the email.
    linkCheckingHeading: 'Opening your link',
    linkCheckingBody: 'One moment — we are checking the link from your email.',
    expiredHeading: 'That link has expired',
    // Says what we CAN do, not that we did: the resend below may find nothing to send.
    expiredBody: 'Our links work for 30 minutes. We can send another email to {email}.',
    // Fallback for the rare case the 410 body omits the masked address — still says what we CAN do,
    // just without naming an address we were not given.
    expiredBodyNoEmail: 'Our links work for 30 minutes. We can send another email below.',
    invalidHeading: 'That link did not work',
    invalidBody:
      'Email programs sometimes cut a link short. Start over below and we will email you a new one, if we have anything for your address.',
    // The check itself failed (offline, a dropped mobile connection, a 500, a rate limit) — which says
    // nothing about the link. It is very likely still good, so this copy must never call it broken:
    // it offers another attempt, and keeps a fresh start available anyway.
    checkFailedHeading: 'We could not check your link just now',
    checkFailedBody:
      'The connection dropped, or something went wrong on our side. Your link usually still works — try again below.',
    checkFailedRetry: 'Try again',
    // Shown instead of the retry button's label while the 429 cooldown the composable started is
    // still running — mirrors resendIn so the same wait reads the same way everywhere.
    checkFailedRetryIn: 'You can try again in {seconds}s',
    listHeading: 'What we have for that address',
    listEmpty:
      "We couldn't find anything for that address. If you booked with a different email — a work address, or a partner's — try that one instead.",
    item: {
      orderReference: 'Order #{reference}',
      orderedOn: 'Ordered {date}',
      sentOn: 'Sent {date}',
      viewOrder: 'View my order',
      finishPayment: 'Finish payment',
      updateAnswers: 'Update my answers',
    },
    status: {
      pending: 'Not paid yet',
      paid: 'Paid',
      failed: 'Payment did not go through',
      refunded: 'Refunded',
      cancelled: 'Cancelled',
      expired: 'Expired',
      submitted: 'Sent',
    },
    error: {
      email: 'Please enter the email address you used.',
      code: 'Please enter the 6-digit code from the email.',
      codeWrong: 'That code is not right. Please check it and try again.',
      sendFailed: 'We could not send that just now. Please try again.',
      tooMany: 'Too many tries. Please wait a minute, then try again.',
      linkInvalid: 'That link is not valid. Please enter your email address to start again.',
      checkFailed: 'We could not check your link just now. Please try again.',
      listFailed: 'Your code was right, but we could not load your orders just now. Please try again.',
    },
    // The three discoverability entry points (footer, order-hub error state, event/form pages) —
    // all link to /recover. None of these promise anything was found; they just point the way.
    footerLink: 'Find my order',
    alreadyRegistered: 'Already registered? Find my order',
    orderErrorCta: "Can't open your order? Find my order",
  },
}
