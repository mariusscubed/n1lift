import { Request, Response } from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { findUserByProvider, createUser } from '../models/queries';

const JWT_SECRET     = process.env.JWT_SECRET || 'secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

interface SocialPayload {
  provider: 'google' | 'facebook' | 'apple';
  token: string;
}

/**
 * POST /api/auth/social
 * Verifies a social OAuth token, upserts the user, and returns a JWT.
 */
export async function socialLogin(req: Request, res: Response): Promise<void> {
  try {
    const { provider, token }: SocialPayload = req.body;

    if (!provider || !token) {
      res.status(400).json({ error: 'provider and token are required' });
      return;
    }

    let profileData: { id: string; name: string; email: string; picture: string };

    if (provider === 'google') {
      const { data } = await axios.get(
        `https://www.googleapis.com/oauth2/v3/userinfo`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      profileData = { id: data.sub, name: data.name, email: data.email, picture: data.picture };
    } else if (provider === 'facebook') {
      const { data } = await axios.get(
        `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${token}`
      );
      profileData = { id: data.id, name: data.name, email: data.email, picture: data.picture?.data?.url || '' };
    } else if (provider === 'apple') {
      // Apple tokens are verified client-side via expo-apple-authentication;
      // the decoded identityToken sub is the stable user identifier.
      // Expect the client to send { provider: 'apple', token: '<sub>', name, email }
      const { sub, name, email } = req.body;
      profileData = { id: sub || token, name: name || 'Apple User', email: email || '', picture: '' };
    } else {
      res.status(400).json({ error: 'Unsupported provider' });
      return;
    }

    // Upsert user
    let user = await findUserByProvider(provider, profileData.id);
    if (!user) {
      user = await createUser({
        provider,
        provider_id:  profileData.id,
        display_name: profileData.name,
        email:        profileData.email,
        avatar_url:   profileData.picture,
      });
    }

    const jwtToken = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    } as jwt.SignOptions);

    res.json({ token: jwtToken, user });
  } catch (err) {
    console.error('socialLogin error:', err);
    res.status(500).json({ error: 'Authentication failed' });
  }
}
