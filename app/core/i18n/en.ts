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
}
