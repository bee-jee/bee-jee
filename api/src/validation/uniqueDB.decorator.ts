import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { model } from 'mongoose';

@ValidatorConstraint({ name: 'uniqueDB', async: true })
export class UniqueDBConstraint implements ValidatorConstraintInterface {
  async validate(text: string, args: ValidationArguments): Promise<boolean> {
    if (args.constraints.length !== 2) {
      throw new Error('Invalid use of UniqueDB');
    }

    const [modelName, field] = args.constraints as [string, string];
    return !(await model(modelName).exists({
      [field]: text,
    }));
  }

  defaultMessage(args: ValidationArguments) {
    if (args.constraints.length !== 2) {
      throw new Error('Invalid use of UniqueDB');
    }
    const [, field]: [any, string] = args.constraints as [string, string];
    return `${field} has been taken, please choose another one.`;
  }
}

type DBOptions = {
  modelName: string;
  field: string;
};

export function UniqueDB(dbOptions: DBOptions, options?: ValidationOptions) {
  return (object: any, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options,
      constraints: [dbOptions.modelName, dbOptions.field],
      validator: UniqueDBConstraint,
    });
  };
}
