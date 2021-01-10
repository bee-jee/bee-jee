import { container } from 'tsyringe';
import ConfigService from '../config/config.service';

const make = container.resolve.bind(container);

const { config } = (make(ConfigService) as ConfigService);

export function frontEndUrl(path: string): string {
  const formattedPath = path.startsWith('/') ? path.slice(1) : path;
  return `${config.VUE_APP_URL}/#/${formattedPath}`;
}
