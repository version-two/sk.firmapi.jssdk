export class ApiException extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode: number = 0) {
    super(message);
    this.name = 'ApiException';
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, ApiException.prototype);
  }
}

export class AuthenticationException extends ApiException {
  constructor(message: string = 'Authentication failed') {
    super(message, 401);
    this.name = 'AuthenticationException';
    Object.setPrototypeOf(this, AuthenticationException.prototype);
  }
}

export class RateLimitException extends ApiException {
  public readonly retryAfter: number;

  constructor(message: string = 'Rate limit exceeded', retryAfter: number = 60) {
    super(message, 429);
    this.name = 'RateLimitException';
    this.retryAfter = retryAfter;
    Object.setPrototypeOf(this, RateLimitException.prototype);
  }
}

export class ValidationException extends ApiException {
  public readonly errors: Record<string, string[]>;

  constructor(
    message: string = 'Validation failed',
    errors: Record<string, string[]> = {}
  ) {
    super(message, 422);
    this.name = 'ValidationException';
    this.errors = errors;
    Object.setPrototypeOf(this, ValidationException.prototype);
  }

  getFieldErrors(field: string): string[] {
    return this.errors[field] ?? [];
  }
}
