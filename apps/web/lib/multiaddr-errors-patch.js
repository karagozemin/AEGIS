/**
 * Patched version of @multiformats/multiaddr/dist/src/errors.js
 * Fixes MetaMask SES lockdown issue where setting this.name fails
 * 
 * Original code: name = 'ErrorName'; (class field)
 * This fails because SES freezes Error.prototype.name
 * 
 * Fix: Use Object.defineProperty instead of direct assignment
 */

function defineErrorName(instance, name) {
  try {
    Object.defineProperty(instance, 'name', {
      value: name,
      enumerable: false,
      configurable: true,
      writable: true
    });
  } catch (e) {
    // If defineProperty fails, the error still works, just without a custom name
  }
}

export class InvalidMultiaddrError extends Error {
  static name = 'InvalidMultiaddrError';
  
  constructor(message) {
    super(message);
    defineErrorName(this, 'InvalidMultiaddrError');
  }
}

export class ValidationError extends Error {
  static name = 'ValidationError';
  
  constructor(message) {
    super(message);
    defineErrorName(this, 'ValidationError');
  }
}

export class InvalidParametersError extends Error {
  static name = 'InvalidParametersError';
  
  constructor(message) {
    super(message);
    defineErrorName(this, 'InvalidParametersError');
  }
}

export class UnknownProtocolError extends Error {
  static name = 'UnknownProtocolError';
  
  constructor(message) {
    super(message);
    defineErrorName(this, 'UnknownProtocolError');
  }
}
