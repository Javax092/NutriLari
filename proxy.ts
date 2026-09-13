import { NextResponse, type NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const user = process.env.ADMIN_USER
  const password = process.env.ADMIN_PASSWORD
  if (!user || !password) return unauthorized()

  const header = request.headers.get('authorization') || ''
  const [scheme, encoded] = header.split(' ')
  const decoded = decodeBasicAuth(scheme, encoded)
  if (!decoded) return unauthorized()
  const [givenUser, givenPassword] = decoded
  if (givenUser === user && givenPassword === password) return NextResponse.next()
  return unauthorized()
}

function decodeBasicAuth(scheme: string | undefined, encoded: string | undefined) {
  if (scheme !== 'Basic' || !encoded) return null
  try {
    const decoded = atob(encoded)
    const separator = decoded.indexOf(':')
    if (separator < 0) return null
    return [decoded.slice(0, separator), decoded.slice(separator + 1)]
  } catch {
    return null
  }
}

function unauthorized() {
  return new NextResponse('Autenticação necessária.', {
    status: 401,
    headers: { 'www-authenticate': 'Basic realm="Larissa Analytics"' },
  })
}

export const config = {
  matcher: '/admin/:path*',
}
