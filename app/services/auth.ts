import * as Google from 'expo-auth-session/providers/google';
import * as Facebook from 'expo-auth-session/providers/facebook';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import api from './api';
import { User } from '../types';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID  = Constants.expoConfig?.extra?.googleClientId  || '';
const FACEBOOK_APP_ID   = Constants.expoConfig?.extra?.facebookAppId   || '';

/**
 * Returns Expo Google auth request hooks.
 * Call this at the top of the AuthScreen component.
 */
export function useGoogleAuth() {
  return Google.useAuthRequest({
    clientId: GOOGLE_CLIENT_ID,
  });
}

/**
 * Returns Expo Facebook auth request hooks.
 */
export function useFacebookAuth() {
  return Facebook.useAuthRequest({ clientId: FACEBOOK_APP_ID });
}

/**
 * Exchange a social provider token for an N1Lift JWT.
 */
export async function socialLogin(
  provider: 'google' | 'facebook',
  token: string
): Promise<{ token: string; user: User }> {
  const { data } = await api.post('/api/auth/social', { provider, token });
  return data;
}

/**
 * Sign in with Apple (iOS only).
 * Returns the N1Lift JWT + user.
 */
export async function appleLogin(): Promise<{ token: string; user: User }> {
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });

  const name = [
    credential.fullName?.givenName,
    credential.fullName?.familyName,
  ]
    .filter(Boolean)
    .join(' ');

  const { data } = await api.post('/api/auth/social', {
    provider: 'apple',
    token:    credential.identityToken,
    sub:      credential.user,
    name:     name || 'Apple User',
    email:    credential.email || '',
  });

  return data;
}

/**
 * Send a WhatsApp OTP to the given phone number.
 */
export async function sendOTP(phone: string): Promise<void> {
  await api.post('/api/auth/otp/send', { phone });
}

/**
 * Verify a WhatsApp OTP and return the N1Lift JWT + user.
 */
export async function verifyOTP(
  phone: string,
  otp: string
): Promise<{ token: string; user: User }> {
  const { data } = await api.post('/api/auth/otp/verify', { phone, otp });
  return data;
}
