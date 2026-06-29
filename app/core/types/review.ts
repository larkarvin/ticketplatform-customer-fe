// Generic read-back types for any flow with a review/confirm step (forms, checkout).
// `editTarget` is an opaque numeric handle the host maps back to "where editing this group jumps to"
// (a form step index, a checkout section id, …).
export interface ReviewItem {
  /** Stable v-for key (a field id, a participant index, …). */
  key: string | number
  label: string
  value: string
}
export interface ReviewGroup {
  editTarget: number
  title: string
  items: ReviewItem[]
}
