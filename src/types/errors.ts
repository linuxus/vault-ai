/**
 * Base error class for Vault operations
 */
export class VaultError extends Error {
  public readonly statusCode: number;
  public readonly errors: string[];

  constructor(message: string, statusCode: number = 500, errors: string[] = []) {
    super(message);
    this.name = 'VaultError';
    this.statusCode = statusCode;
    this.errors = errors.length > 0 ? errors : [message];
    Object.setPrototypeOf(this, VaultError.prototype);
  }
}

/**
 * 401 Unauthorized - Invalid or expired token
 */
export class AuthenticationError extends VaultError {
  constructor(message: string = 'Authentication required', errors: string[] = []) {
    super(message, 401, errors);
    this.name = 'AuthenticationError';
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

/**
 * 403 Forbidden - Insufficient permissions
 */
export class PermissionError extends VaultError {
  constructor(message: string = 'Permission denied', errors: string[] = []) {
    super(message, 403, errors);
    this.name = 'PermissionError';
    Object.setPrototypeOf(this, PermissionError.prototype);
  }
}

/**
 * 404 Not Found - Secret or path doesn't exist
 */
export class NotFoundError extends VaultError {
  constructor(message: string = 'Resource not found', errors: string[] = []) {
    super(message, 404, errors);
    this.name = 'NotFoundError';
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * Type guard to check if error is a VaultError
 */
export function isVaultError(error: unknown): error is VaultError {
  return error instanceof VaultError;
}

/**
 * Extract error message from various error types
 */
export function getErrorMessage(error: unknown): string {
  if (isVaultError(error)) {
    return error.errors[0] || error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
}
