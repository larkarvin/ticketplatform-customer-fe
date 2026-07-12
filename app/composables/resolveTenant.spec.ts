import { describe, expect, it } from 'vitest'
import { resolveTenant } from './resolveTenant'

const base = { orgSubdomain: '', baseDomain: 'example.com', devOrgSubdomain: '' }

describe('resolveTenant', () => {
  it('prefers the explicit env org over the host', () => {
    expect(resolveTenant('acme.example.com', { ...base, orgSubdomain: 'envorg' })).toBe('envorg')
  })
  it('falls back to the host subdomain when no env org', () => {
    expect(resolveTenant('acme.example.com', base)).toBe('acme')
  })
  it('falls back to devOrgSubdomain on a bare host', () => {
    expect(resolveTenant('example.com', { ...base, devOrgSubdomain: 'dev' })).toBe('dev')
  })
  it('returns null when nothing resolves', () => {
    expect(resolveTenant('example.com', base)).toBeNull()
  })
})
