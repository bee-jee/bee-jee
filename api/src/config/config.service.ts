import { singleton } from 'tsyringe';
import validateEnv from '../utils/env';
import Configuration from './config.interface';

@singleton()
class ConfigService {
  private mConfig: Configuration;

  constructor() {
    this.mConfig = validateEnv();
  }

  public get(key: string): string | undefined {
    return this.mConfig[key];
  }

  public get config(): Configuration {
    return this.mConfig;
  }
}

export default ConfigService;
