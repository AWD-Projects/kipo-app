/**
 * OpenAI Integration for Kipo Finance Tracker
 * Handles all AI-powered features for budgeting and financial insights
 */

import OpenAI from 'openai';

// Initialize OpenAI client
// Note: API key should be set in environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

/**
 * Check if OpenAI is configured
 */
export function isOpenAIConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

/**
 * Get OpenAI client instance
 * Throws error if not configured
 */
export function getOpenAIClient(): OpenAI {
  if (!isOpenAIConfigured()) {
    throw new Error('OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.');
  }
  return openai;
}

export default openai;
