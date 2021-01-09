import {
  Client, Falsey, Token, RefreshToken,
} from 'oauth2-server';
import bcrypt from 'bcrypt';
import { User } from '../user/user.interface';
import { OAuthTokenModel, OAuthClientModel } from './authentication.model';
import UserModel from '../user/user.model';
import UserIsNotConfirmedException from '../exceptions/UserIsNotConfirmedException';

const OAuthModel = {
  async getAccessToken(accessToken: string): Promise<Token | Falsey> {
    return OAuthTokenModel
      .findOne({ accessToken })
      .populate([
        'client', 'user',
      ])
      .lean();
  },
  async getClient(clientId: string, clientSecret: string): Promise<Client | Falsey> {
    return OAuthClientModel.findOne({ id: clientId, clientSecret }).lean();
  },
  async saveToken(token: Token, client: Client, user: User): Promise<Token | Falsey> {
    token.client = client;
    token.user = user;
    const tokenInstance = await (new OAuthTokenModel(token)).save();
    await tokenInstance.populate('user').execPopulate();
    return tokenInstance;
  },
  async getUser(username: string, password: string): Promise<User | Falsey> {
    const user = await UserModel.findOne({ username });
    if (user) {
      if (!user.confirm) {
        throw new UserIsNotConfirmedException(user);
      }

      const passwordMatched = await bcrypt.compare(
        password,
        user.get('password', null, { getters: false }),
      );
      if (passwordMatched) {
        user.password = undefined;
        return user;
      }
    }
    return undefined;
  },
  async getUserFromClient(client: Client): Promise<(User & { _id: any }) | Falsey> {
    const clientDb = await OAuthClientModel.findOne({
      clientId: client.clientId,
      clientSecret: client.clientSecret,
      grants: 'client_credentials',
    });
    if (clientDb) {
      return {
        _id: '',
        username: '',
        password: '',
        email: '',
        firstName: '',
        lastName: '',
        fullName: '',
        initials: '',
        role: '',
        created: new Date(),
        updated: new Date(),
      };
    }
    return null;
  },
  async getRefreshToken(refreshToken: string): Promise<RefreshToken | Falsey> {
    return OAuthTokenModel
      .findOne({ refreshToken })
      .populate([
        'client',
      ])
      .lean();
  },
  async revokeToken(token: RefreshToken | Token): Promise<boolean> {
    const deleted = await OAuthTokenModel.deleteOne({ refreshToken: token.refreshToken });
    return deleted && deleted.deletedCount === 1;
  },
  async verifyScope(token: Token, scope: string | string[]): Promise<boolean> {
    const accessToken = await this.getAccessToken(token.accessToken);
    if (!accessToken) {
      return false;
    }
    if (!accessToken.scope) {
      return true;
    }
    const tokenScopes: string[] = [];
    if (typeof accessToken.scope === 'string') {
      tokenScopes.push(accessToken.scope);
    } else {
      tokenScopes.concat(accessToken.scope);
    }
    if (tokenScopes.length === 0) {
      return true;
    }
    if (typeof scope === 'string') {
      return tokenScopes.indexOf(scope) >= 0;
    }
    return !scope.some((s) => tokenScopes.indexOf(s) < 0);
  },
};

export default OAuthModel;
