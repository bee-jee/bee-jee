import { createTransport, SendMailOptions } from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { container } from 'tsyringe';
import ConfigService from '../config/config.service';

const make = container.resolve.bind(container);

const configService: ConfigService = make(ConfigService);

const { config } = configService;

const transportOptions: SMTPTransport.Options = {
  host: config.SMTP_HOST,
  port: config.SMTP_PORT,
  secure: config.SMTP_SECURE,
};

if (config.SMTP_USERNAME && config.SMTP_PASSWORD) {
  transportOptions.auth = {
    user: config.SMTP_USERNAME,
    pass: config.SMTP_PASSWORD,
  };
}

const transporter = createTransport(transportOptions);

const sendMail = async (opts: SendMailOptions): Promise<any> => {
  if (!opts.from) {
    opts.from = `"${config.MAIL_FROM_NAME}" <${config.MAIL_FROM_ADDRESS}>`;
  }
  if (!opts.text) {
    opts.text = 'This email is only compatible in HTML, please use an email client that supports HTML';
  }

  return transporter.sendMail(opts);
};

export default sendMail;
