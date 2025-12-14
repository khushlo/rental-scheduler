import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'
);

export interface JWTPayload {
  userId: number;
  username: string;
  tenantId: number;
  role: 'user' | 'admin';
  exp?: number;
}

// Token cache for logout invalidation
const tokenBlacklist = new Set<string>();

// Clear expired tokens from blacklist every hour
setInterval(() => {
  const now = Math.floor(Date.now() / 1000);
  tokenBlacklist.forEach(token => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp && payload.exp < now) {
        tokenBlacklist.delete(token);
      }
    } catch {
      // Invalid token format, remove it
      tokenBlacklist.delete(token);
    }
  });
}, 60 * 60 * 1000); // 1 hour

export async function generateToken(payload: Omit<JWTPayload, 'exp'>): Promise<string> {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h') // 24 hours lifespan
    .sign(JWT_SECRET);

  return token;
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    // Check if token is blacklisted
    if (tokenBlacklist.has(token)) {
      return null;
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    
    // Verify required fields (userId can be 0 for admin, so check for null/undefined)
    if (payload.userId === null || payload.userId === undefined || !payload.username || payload.tenantId === null || payload.tenantId === undefined || !payload.role) {
      return null;
    }

    return {
      userId: payload.userId as number,
      username: payload.username as string,
      tenantId: payload.tenantId as number,
      role: payload.role as 'user' | 'admin',
      exp: payload.exp as number
    };
  } catch (error) {
    console.error('JWT verification error:', error);
    return null;
  }
}

export function invalidateToken(token: string): void {
  tokenBlacklist.add(token);
}

export function getAuthToken(request: Request): string | null {
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

export function getAuthTokenFromCookies(cookies: string | null): string | null {
  if (!cookies) return null;
  
  const match = cookies.match(/auth-token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

// Helper function to check if user has access to tenant
export function hasAccessToTenant(userTenantId: number, requestedTenantId: number): boolean {
  return userTenantId === requestedTenantId;
}

// Helper function to extract tenant ID from subdomain
export function extractTenantFromRequest(request: Request): { tenantId?: number; subdomain?: string } {
  const url = new URL(request.url);
  const host = request.headers.get('host') || url.hostname;
  
  // Extract subdomain if present
  const parts = host.split('.');
  if (parts.length > 2) {
    const subdomain = parts[0];
    // You might want to add logic here to map subdomain to tenant ID
    return { subdomain };
  }
  
  return {};
}