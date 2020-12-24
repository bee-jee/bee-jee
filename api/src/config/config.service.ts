import { singleton } from 'tsyringe';
import * as path from 'path';
import validateEnv from '../utils/env';
import Configuration from './config.interface';

const transformations = [
  (str: string) => str.replace(/\${WORKSPACE_ROOT_DIR}/, path.resolve(__dirname, '..', '..', '..')),
];

@singleton()
class ConfigService {
  private mConfig: Configuration;

  constructor() {
    this.mConfig = validateEnv();

    Object.keys(this.mConfig).forEach((key) => {
      const value = this.mConfig[key];

      if (typeof value !== 'string') {
        return;
      }

      this.mConfig = {
        ...this.mConfig,
        [key]: this.applyTransforms(value),
      };
    });
  }

  public get(key: string): string | undefined {
    return this.mConfig[key];
  }

  public get config(): Configuration {
    return this.mConfig;
  }

  private applyTransforms(value: string): string {
    let result = value;
    transformations.forEach((transform) => {
      result = transform(result);
    });
    return result;
  }
}

export default ConfigService;
