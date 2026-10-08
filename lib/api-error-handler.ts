import { NextResponse } from 'next/server';

/**
 * Standard API error response helper.
 * Prevents exposing internal database stack traces, SQL errors, or sensitive exception messages in production.
 */
export function formatApiError(
  error: unknown,
  fallbackMessage = 'Une erreur interne est survenue.',
  status = 500,
  nodeEnv = process.env.NODE_ENV
): NextResponse {
  const isProduction = nodeEnv === 'production';
  const errorMessage = error instanceof Error ? error.message : String(error);

  // In production, redact 500+ internal server errors to avoid information leakage
  const safeMessage = isProduction && status >= 500
    ? fallbackMessage
    : (errorMessage || fallbackMessage);

  return NextResponse.json(
    { error: safeMessage },
    { status }
  );
}

export function handleServerError(
  error: unknown,
  context = '[API Error]',
  fallbackMessage = 'Une erreur interne est survenue.',
  nodeEnv = process.env.NODE_ENV
): NextResponse {
  console.error(context, error);
  return formatApiError(error, fallbackMessage, 500, nodeEnv);
}
