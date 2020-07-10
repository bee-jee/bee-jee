import * as jwt from 'jsonwebtoken';
import { User } from '../user/user.interface';
import DataStoredInToken from '../interfaces/dataStoredInToken.interface';
import JWTSecretIsMissingException from '../exceptions/JWSSecretIsMissingException';
import TokenData from '../interfaces/tokenData.interface';

class AuthenticationService {
  public static createCookie(tokenData: TokenData) {
    return `Authorization=${tokenData.token}; HttpOnly; Max-Age=${tokenData.expiresIn}`;
  }

  public static createToken(user: User): TokenData {
    const expiresIn = 60 * 60; // an hour
    const secret = process.env.JWT_SECRET;
    const data: DataStoredInToken = {
      id: user._id,
    };
    if (secret === undefined) {
      throw new JWTSecretIsMissingException();
    }
    return {
      expiresIn,
      token: jwt.sign(data, secret, { expiresIn }),
    };
  }
}

export default AuthenticationService;
