// app/whitelabels/staffLinks.ts
// Builds the organizer auth links that the marketing chrome points at. Auth itself lives in
// staff-fe (app.<domain>); this app only links out. Returns enabled=false when unconfigured so
// callers hide the buttons rather than link nowhere.
export interface StaffLinks {
  enabled: boolean
  signIn: string
  signUp: string
}

export function staffLinks(staffUrl: string | undefined): StaffLinks {
  const base = (staffUrl ?? '').trim().replace(/\/$/, '')
  if (!base) return { enabled: false, signIn: '', signUp: '' }
  return { enabled: true, signIn: `${base}/login`, signUp: `${base}/signup` }
}
