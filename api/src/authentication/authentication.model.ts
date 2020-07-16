import { Schema, model, Document } from 'mongoose';
import { Client, Token } from 'oauth2-server';

const oauthTokenSchema = new Schema({
  accessToken: { type: String },
  accessTokenExpiresAt: { type: Date },
  refreshToken: { type: String },
  refreshTokenExpiresAt: { type: Date },
  scope: { type: Array },
  client: {
    ref: 'OAuthClient',
    type: Schema.Types.ObjectId,
  },
  user: {
    ref: 'User',
    type: Schema.Types.ObjectId,
  },
});

export const OAuthTokenModel = model<Token & Document>('OAuthToken', oauthTokenSchema);

const oauthClientSchema = new Schema({
  id: { type: String },
  redirectUris: { type: Array },
  grants: { type: Array },
  accessTokenLifetime: { type: Number },
  refreshTokenLifetime: { type: Number },
  clientSecret: { type: String },
});

export const OAuthClientModel = model<Client & Document>('OAuthClient', oauthClientSchema);
