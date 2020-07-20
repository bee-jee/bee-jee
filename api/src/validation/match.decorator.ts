import {
  ValidationOptions, registerDecorator, ValidatorConstraintInterface,
  ValidationArguments,
  ValidatorConstraint,
} from 'class-validator';

@ValidatorConstraint({ name: 'Match' })
export class MatchConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const [relatedPropertyName] = args.constraints;
    const relatedValue = (args.object as any)[relatedPropertyName];
    return value === relatedValue;
  }

  defaultMessage(args?: ValidationArguments): string {
    if (typeof args === 'undefined') {
      return 'MatchConstraint failed';
    }
    return `${args.property} does not match ${args.constraints[0]}`;
  }
}

export function Match(property: string, options?: ValidationOptions) {
  return (object: any, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options,
      constraints: [property],
      validator: MatchConstraint,
    });
  };
}
