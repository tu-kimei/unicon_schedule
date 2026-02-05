# Security Guidelines - Unicon Schedule System

**Version**: 1.0  
**Last Updated**: 2024-01-22  
**Classification**: Internal Use Only

---

## 1. Security Overview

### Security Principles

1. **Defense in Depth**: Multiple layers of security controls
2. **Least Privilege**: Users have minimum necessary permissions
3. **Secure by Default**: Security built into every feature
4. **Audit Everything**: Comprehensive logging of security events
5. **Fail Securely**: Errors don't expose sensitive information

### Threat Model

```
┌─────────────────────────────────────────────────────────┐
│                    Threat Landscape                      │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  External Threats:                                       │
│  • Unauthorized access attempts                          │
│  • SQL injection attacks                                 │
│  • XSS attacks                                           │
│  • CSRF attacks                                          │
│  • DDoS attacks                                          │
│  • Malicious file uploads                                │
│                                                           │
│  Internal Threats:                                       │
│  • Privilege escalation                                  │
│  • Data exfiltration                                     │
│  • Insider threats                                       │
│  • Accidental data exposure                              │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Authentication Security

### 2.1 Password Security

#### Password Requirements
```typescript
// src/auth/validation.ts
export const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecialChar: true,
  specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?'
};

export const validatePassword = (password: string): {
  valid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    errors.push(`Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters`);
  }

  if (password.length > PASSWORD_REQUIREMENTS.maxLength) {
    errors.push(`Password must be less than ${PASSWORD_REQUIREMENTS.maxLength} characters`);
  }

  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (PASSWORD_REQUIREMENTS.requireNumber && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (PASSWORD_REQUIREMENTS.requireSpecialChar) {
    const specialCharRegex = new RegExp(`[${PASSWORD_REQUIREMENTS.specialChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`);
    if (!specialCharRegex.test(password)) {
      errors.push('Password must contain at least one special character');
    }
  }

  // Check for common passwords
  if (COMMON_PASSWORDS.includes(password.toLowerCase())) {
    errors.push('Password is too common. Please choose a stronger password');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

// Common passwords to block
const COMMON_PASSWORDS = [
  'password', 'password123', '12345678', 'qwerty', 'abc123',
  'monkey', '1234567', 'letmein', 'trustno1', 'dragon'
];
```

#### Password Hashing
```typescript
// Wasp uses bcrypt by default with 10 salt rounds
// src/auth/password.ts
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

export const verifyPassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};
```

#### Password Reset Security
```typescript
// src/auth/passwordReset.ts
import crypto from 'crypto';

export const generateResetToken = (): {
  token: string;
  hashedToken: string;
  expiresAt: Date;
} => {
  // Generate cryptographically secure random token
  const token = crypto.randomBytes(32).toString('hex');
  
  // Hash token before storing in database
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  
  // Token expires in 1 hour
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  
  return { token, hashedToken, expiresAt };
};

export const verifyResetToken = (
  token: string,
  hashedToken: string,
  expiresAt: Date
): boolean => {
  // Check if token expired
  if (new Date() > expiresAt) {
    return false;
  }
  
  // Hash provided token and compare
  const hashedProvidedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  
  return hashedProvidedToken === hashedToken;
};
```

### 2.2 JWT Token Security

#### Token Configuration
```typescript
// src/auth/jwt.ts
export const JWT_CONFIG = {
  // Access token (short-lived)
  accessToken: {
    expiresIn: '15m',
    algorithm: 'HS256' as const,
    issuer: 'unicon-schedule',
    audience: 'unicon-users'
  },
  
  // Refresh token (long-lived)
  refreshToken: {
    expiresIn: '7d',
    algorithm: 'HS256' as const
  }
};

export const generateAccessToken = (userId: string, role: string): string => {
  return jwt.sign(
    {
      userId,
      role,
      type: 'access'
    },
    process.env.JWT_SECRET!,
    {
      expiresIn: JWT_CONFIG.accessToken.expiresIn,
      algorithm: JWT_CONFIG.accessToken.algorithm,
      issuer: JWT_CONFIG.accessToken.issuer,
      audience: JWT_CONFIG.accessToken.audience
    }
  );
};

export const verifyAccessToken = (token: string): {
  valid: boolean;
  payload?: any;
  error?: string;
} => {
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!, {
      algorithms: [JWT_CONFIG.accessToken.algorithm],
      issuer: JWT_CONFIG.accessToken.issuer,
      audience: JWT_CONFIG.accessToken.audience
    });
    
    return { valid: true, payload };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return { valid: false, error: 'Token expired' };
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return { valid: false, error: 'Invalid token' };
    }
    return { valid: false, error: 'Token verification failed' };
  }
};
```

#### Token Storage
```typescript
// Frontend token storage
// src/auth/tokenStorage.ts

// ❌ NEVER store in localStorage (vulnerable to XSS)
// localStorage.setItem('token', token);

// ✅ Store in httpOnly cookie (set by backend)
// Cookie configuration in backend:
export const TOKEN_COOKIE_CONFIG = {
  httpOnly: true,      // Not accessible via JavaScript
  secure: true,        // Only sent over HTTPS
  sameSite: 'strict',  // CSRF protection
  maxAge: 15 * 60 * 1000, // 15 minutes
  path: '/'
};
```

### 2.3 Session Management

#### Session Configuration
```typescript
// src/auth/session.ts
export const SESSION_CONFIG = {
  // Session timeout after 15 minutes of inactivity
  inactivityTimeout: 15 * 60 * 1000,
  
  // Absolute session timeout (8 hours)
  absoluteTimeout: 8 * 60 * 60 * 1000,
  
  // Maximum concurrent sessions per user
  maxConcurrentSessions: 3,
  
  // Session storage
  storage: 'redis' // or 'memory' for development
};

export const createSession = async (
  userId: string,
  userAgent: string,
  ipAddress: string
): Promise<string> => {
  const sessionId = crypto.randomBytes(32).toString('hex');
  
  const session = {
    userId,
    sessionId,
    userAgent,
    ipAddress,
    createdAt: new Date(),
    lastActivityAt: new Date(),
    expiresAt: new Date(Date.now() + SESSION_CONFIG.absoluteTimeout)
  };
  
  // Store in Redis
  await redis.setex(
    `session:${sessionId}`,
    SESSION_CONFIG.absoluteTimeout / 1000,
    JSON.stringify(session)
  );
  
  // Track user sessions
  await redis.sadd(`user:${userId}:sessions`, sessionId);
  
  // Enforce max concurrent sessions
  await enforceMaxSessions(userId);
  
  return sessionId;
};

const enforceMaxSessions = async (userId: string) => {
  const sessions = await redis.smembers(`user:${userId}:sessions`);
  
  if (sessions.length > SESSION_CONFIG.maxConcurrentSessions) {
    // Remove oldest sessions
    const sessionsToRemove = sessions.slice(
      0,
      sessions.length - SESSION_CONFIG.maxConcurrentSessions
    );
    
    for (const sessionId of sessionsToRemove) {
      await redis.del(`session:${sessionId}`);
      await redis.srem(`user:${userId}:sessions`, sessionId);
    }
  }
};
```

### 2.4 Multi-Factor Authentication (Future)

```typescript
// src/auth/mfa.ts (Future implementation)
export const MFA_CONFIG = {
  enabled: false, // Enable in future phase
  methods: ['totp', 'sms'], // TOTP (Google Authenticator) or SMS
  backupCodes: 10 // Number of backup codes to generate
};

// TOTP implementation
export const generateTOTPSecret = (): {
  secret: string;
  qrCode: string;
} => {
  const secret = speakeasy.generateSecret({
    name: 'Unicon Schedule',
    issuer: 'Unicon Ltd'
  });
  
  return {
    secret: secret.base32,
    qrCode: secret.otpauth_url!
  };
};

export const verifyTOTP = (token: string, secret: string): boolean => {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 2 // Allow 2 time steps before/after
  });
};
```

---

## 3. Authorization & Access Control

### 3.1 Role-Based Access Control (RBAC)

#### Permission Matrix
```typescript
// src/auth/permissions.ts
export enum Permission {
  // Shipment permissions
  SHIPMENT_CREATE = 'shipment:create',
  SHIPMENT_READ = 'shipment:read',
  SHIPMENT_UPDATE = 'shipment:update',
  SHIPMENT_DELETE = 'shipment:delete',
  
  // Dispatch permissions
  DISPATCH_CREATE = 'dispatch:create',
  DISPATCH_READ = 'dispatch:read',
  DISPATCH_UPDATE = 'dispatch:update',
  
  // Status permissions
  STATUS_UPDATE = 'status:update',
  
  // POD permissions
  POD_UPLOAD = 'pod:upload',
  POD_READ = 'pod:read',
  POD_DELETE = 'pod:delete',
  
  // Invoice permissions
  INVOICE_CREATE = 'invoice:create',
  INVOICE_READ = 'invoice:read',
  INVOICE_UPDATE = 'invoice:update',
  
  // User management
  USER_CREATE = 'user:create',
  USER_READ = 'user:read',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',
  
  // Admin
  ADMIN_ALL = '*'
}

export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  OPS: [
    Permission.SHIPMENT_CREATE,
    Permission.SHIPMENT_READ,
    Permission.SHIPMENT_UPDATE,
    Permission.POD_UPLOAD,
    Permission.POD_READ,
    Permission.STATUS_UPDATE
  ],
  
  DISPATCHER: [
    Permission.SHIPMENT_READ,
    Permission.DISPATCH_CREATE,
    Permission.DISPATCH_READ,
    Permission.DISPATCH_UPDATE,
    Permission.STATUS_UPDATE
  ],
  
  ACCOUNTING: [
    Permission.SHIPMENT_READ,
    Permission.INVOICE_CREATE,
    Permission.INVOICE_READ,
    Permission.INVOICE_UPDATE
  ],
  
  DRIVER: [
    Permission.SHIPMENT_READ,
    Permission.STATUS_UPDATE,
    Permission.POD_UPLOAD,
    Permission.POD_READ
  ],
  
  ADMIN: [Permission.ADMIN_ALL]
};

export const hasPermission = (
  userRole: string,
  permission: Permission
): boolean => {
  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
  
  // Admin has all permissions
  if (rolePermissions.includes(Permission.ADMIN_ALL)) {
    return true;
  }
  
  return rolePermissions.includes(permission);
};
```

#### Permission Middleware
```typescript
// src/middleware/auth.ts
export const requirePermission = (permission: Permission) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
    }
    
    if (!hasPermission(user.role, permission)) {
      // Log unauthorized access attempt
      await logSecurityEvent({
        type: 'UNAUTHORIZED_ACCESS',
        userId: user.id,
        permission,
        resource: req.path,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });
      
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions'
        }
      });
    }
    
    next();
  };
};

// Usage in routes
app.post(
  '/api/shipments',
  requireAuth,
  requirePermission(Permission.SHIPMENT_CREATE),
  createShipmentHandler
);
```

### 3.2 Resource-Level Authorization

```typescript
// src/auth/resourceAuth.ts
export const canAccessShipment = async (
  userId: string,
  shipmentId: string
): Promise<boolean> => {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });
  
  if (!user) return false;
  
  // Admin can access all shipments
  if (user.role === 'ADMIN') return true;
  
  const shipment = await prisma.shipment.findUnique({
    where: { id: shipmentId },
    include: {
      order: {
        include: { customer: true }
      },
      dispatch: {
        include: { driver: true }
      }
    }
  });
  
  if (!shipment) return false;
  
  // Driver can only access their assigned shipments
  if (user.role === 'DRIVER') {
    return shipment.dispatch?.driver?.userId === userId;
  }
  
  // Ops, Dispatcher, Accounting can access all shipments
  return ['OPS', 'DISPATCHER', 'ACCOUNTING'].includes(user.role);
};

// Middleware for resource authorization
export const requireShipmentAccess = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { shipmentId } = req.params;
  const userId = req.user.id;
  
  const hasAccess = await canAccessShipment(userId, shipmentId);
  
  if (!hasAccess) {
    await logSecurityEvent({
      type: 'UNAUTHORIZED_RESOURCE_ACCESS',
      userId,
      resourceType: 'shipment',
      resourceId: shipmentId,
      ipAddress: req.ip
    });
    
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'You do not have access to this shipment'
      }
    });
  }
  
  next();
};
```

---

## 4. Data Security

### 4.1 SQL Injection Prevention

```typescript
// ✅ SAFE: Using Prisma ORM (parameterized queries)
const shipment = await prisma.shipment.findUnique({
  where: { id: shipmentId }
});

// ✅ SAFE: Prisma raw query with parameters
const result = await prisma.$queryRaw`
  SELECT * FROM "Shipment"
  WHERE "id" = ${shipmentId}
  AND "currentStatus" = ${status}
`;

// ❌ UNSAFE: String concatenation (NEVER DO THIS)
const result = await prisma.$queryRawUnsafe(
  `SELECT * FROM "Shipment" WHERE "id" = '${shipmentId}'`
);

// ❌ UNSAFE: Template literal without $queryRaw
const result = await prisma.$executeRawUnsafe(
  `DELETE FROM "Shipment" WHERE "id" = '${shipmentId}'`
);
```

### 4.2 XSS Prevention

#### Input Sanitization
```typescript
// src/utils/sanitize.ts
import DOMPurify from 'isomorphic-dompurify';

export const sanitizeHTML = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href', 'target']
  });
};

export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove < and >
    .substring(0, 1000); // Limit length
};

// Usage in actions
export const createShipment = async (data, context) => {
  const sanitizedData = {
    ...data,
    // Sanitize text fields
    specialInstructions: data.specialInstructions 
      ? sanitizeHTML(data.specialInstructions)
      : undefined,
    stops: data.stops.map(stop => ({
      ...stop,
      locationName: sanitizeInput(stop.locationName),
      address: sanitizeInput(stop.address),
      specialInstructions: stop.specialInstructions
        ? sanitizeHTML(stop.specialInstructions)
        : undefined
    }))
  };
  
  // Continue with sanitized data
};
```

#### Output Encoding
```typescript
// React automatically escapes output
// ✅ SAFE: React JSX
<div>{shipment.description}</div>

// ❌ UNSAFE: dangerouslySetInnerHTML without sanitization
<div dangerouslySetInnerHTML={{ __html: shipment.description }} />

// ✅ SAFE: dangerouslySetInnerHTML with sanitization
<div dangerouslySetInnerHTML={{ 
  __html: sanitizeHTML(shipment.description) 
}} />
```

#### Content Security Policy
```typescript
// vercel.json or next.config.js
export const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Adjust for production
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://api.unicon.ltd",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; ')
  }
];
```

### 4.3 CSRF Protection

```typescript
// src/middleware/csrf.ts
import csrf from 'csurf';

export const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  }
});

// Apply to state-changing routes
app.post('/api/shipments', csrfProtection, createShipmentHandler);
app.put('/api/shipments/:id', csrfProtection, updateShipmentHandler);
app.delete('/api/shipments/:id', csrfProtection, deleteShipmentHandler);

// Frontend: Include CSRF token in requests
const createShipment = async (data) => {
  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
  
  const response = await fetch('/api/shipments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'CSRF-Token': csrfToken
    },
    body: JSON.stringify(data)
  });
  
  return response.json();
};
```

### 4.4 Data Encryption

#### At-Rest Encryption
```typescript
// Database encryption (Supabase default)
// - AES-256 encryption for data at rest
// - Transparent Data Encryption (TDE)

// Additional field-level encryption for sensitive data
import crypto from 'crypto';

const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');
const ALGORITHM = 'aes-256-gcm';

export const encrypt = (text: string): {
  encrypted: string;
  iv: string;
  authTag: string;
} => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
};

export const decrypt = (
  encrypted: string,
  iv: string,
  authTag: string
): string => {
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    ENCRYPTION_KEY,
    Buffer.from(iv, 'hex')
  );
  
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};
```

#### In-Transit Encryption
```typescript
// HTTPS enforced (Vercel default)
// TLS 1.2+ required
// Strong cipher suites only

// Verify HTTPS in production
if (process.env.NODE_ENV === 'production' && req.protocol !== 'https') {
  return res.redirect(301, `https://${req.hostname}${req.url}`);
}
```

---

## 5. File Upload Security

### 5.1 File Validation

```typescript
// src/utils/fileValidation.ts
export const FILE_UPLOAD_CONFIG = {
  allowedMimeTypes: [
    'image/jpeg',
    'image/png',
    'application/pdf'
  ],
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.pdf'],
  maxSize: 5 * 1024 * 1024, // 5MB
  virusScanEnabled: true
};

export const validateFile = (file: Express.Multer.File): {
  valid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  
  // Check file size
  if (file.size > FILE_UPLOAD_CONFIG.maxSize) {
    errors.push(`File size exceeds ${FILE_UPLOAD_CONFIG.maxSize / 1024 / 1024}MB limit`);
  }
  
  // Check MIME type
  if (!FILE_UPLOAD_CONFIG.allowedMimeTypes.includes(file.mimetype)) {
    errors.push(`File type ${file.mimetype} is not allowed`);
  }
  
  // Check file extension
  const ext = path.extname(file.originalname).toLowerCase();
  if (!FILE_UPLOAD_CONFIG.allowedExtensions.includes(ext)) {
    errors.push(`File extension ${ext} is not allowed`);
  }
  
  // Check for double extensions (e.g., file.pdf.exe)
  const parts = file.originalname.split('.');
  if (parts.length > 2) {
    errors.push('Multiple file extensions not allowed');
  }
  
  // Verify file content matches extension
  const fileType = require('file-type');
  const detectedType = await fileType.fromBuffer(file.buffer);
  
  if (detectedType && detectedType.mime !== file.mimetype) {
    errors.push('File content does not match declared type');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};
```

### 5.2 Virus Scanning

```typescript
// src/utils/virusScan.ts
import NodeClam from 'clamscan';

const clamscan = await new NodeClam().init({
  clamdscan: {
    host: process.env.CLAMAV_HOST || 'localhost',
    port: process.env.CLAMAV_PORT || 3310
  }
});

export const scanFile = async (filePath: string): Promise<{
  clean: boolean;
  viruses?: string[];
}> => {
  try {
    const { isInfected, viruses } = await clamscan.isInfected(filePath);
    
    return {
      clean: !isInfected,
      viruses: viruses || []
    };
  } catch (error) {
    console.error('Virus scan error:', error);
    // Fail securely: reject file if scan fails
    return { clean: false, viruses: ['SCAN_ERROR'] };
  }
};
```

### 5.3 Secure File Storage

```typescript
// src/utils/fileStorage.ts
export const generateSecureFilename = (originalFilename: string): string => {
  const ext = path.extname(originalFilename);
  const timestamp = Date.now();
  const random = crypto.randomBytes(16).toString('hex');
  
  return `${timestamp}-${random}${ext}`;
};

export const uploadPOD = async (
  file: Express.Multer.File,
  shipmentId: string
): Promise<{ url: string; publicId: string }> => {
  // 1. Validate file
  const validation = await validateFile(file);
  if (!validation.valid) {
    throw new Error(validation.errors.join(', '));
  }
  
  // 2. Scan for viruses
  const scanResult = await scanFile(file.path);
  if (!scanResult.clean) {
    // Delete file immediately
    await fs.unlink(file.path);
    throw new Error('File contains malware');
  }
  
  // 3. Generate secure filename
  const secureFilename = generateSecureFilename(file.originalname);
  
  // 4. Upload to Cloudinary
  const result = await cloudinary.uploader.upload(file.path, {
    folder: `${process.env.CLOUDINARY_FOLDER}/${shipmentId}`,
    public_id: secureFilename,
    resource_type: 'auto',
    access_mode: 'authenticated', // Require authentication to access
    overwrite: false
  });
  
  // 5. Delete temporary file
  await fs.unlink(file.path);
  
  return {
    url: result.secure_url,
    publicId: result.public_id
  };
};
```

---

## 6. API Security

### 6.1 Rate Limiting

```typescript
// src/middleware/rateLimit.ts
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

// General API rate limit
export const apiLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:api:'
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Strict rate limit for authentication endpoints
export const authLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:auth:'
  }),
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 attempts per 15 minutes
  skipSuccessfulRequests: true, // Don't count successful logins
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_LOGIN_ATTEMPTS',
      message: 'Too many login attempts, please try again in 15 minutes'
    }
  }
});

// File upload rate limit
export const uploadLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:upload:'
  }),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 uploads per hour
  message: {
    success: false,
    error: {
      code: 'UPLOAD_LIMIT_EXCEEDED',
      message: 'Too many file uploads, please try again later'
    }
  }
});

// Apply rate limiters
app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/signup', authLimiter);
app.use('/api/pods/upload', uploadLimiter);
```

### 6.2 Request Validation

```typescript
// src/middleware/validation.ts
import { z } from 'zod';

// Zod schemas for validation
export const CreateShipmentSchema = z.object({
  orderId: z.string().uuid('Invalid order ID'),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']),
  plannedStartDate: z.string().datetime('Invalid start date'),
  plannedEndDate: z.string().datetime('Invalid end date'),
  stops: z.array(z.object({
    sequence: z.number().int
