// src/lib/twilio/verifySignature.ts
import crypto from 'crypto';

/**
 * Verify Twilio webhook signature
 * @param authToken - Twilio Auth Token
 * @param twilioSignature - X-Twilio-Signature header value
 * @param url - The full URL of the webhook endpoint
 * @param body - Raw request body as string
 */
export function verifyTwilioSignature(
  authToken: string,
  twilioSignature: string,
  url: string,
  body: string
): boolean {
  // Create the expected signature
  const data = url + body;
  const expectedSignature = crypto
    .createHmac('sha1', authToken)
    .update(data, 'utf8')
    .digest('base64');

  // Compare signatures using timing-safe comparison
  return crypto.timingSafeEqual(
    Buffer.from(twilioSignature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Validate required Twilio webhook headers
 */
export function validateTwilioHeaders(headers: Headers): {
  signature: string;
  isValid: boolean;
  error?: string;
} {
  const signature = headers.get('X-Twilio-Signature');
  
  if (!signature) {
    return {
      signature: '',
      isValid: false,
      error: 'Missing X-Twilio-Signature header'
    };
  }

  return {
    signature,
    isValid: true
  };
}