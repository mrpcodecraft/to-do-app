import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { NextFunction, Request, RequestHandler, Response } from 'express';
import HttpException from '../../Exceptions/HTTPExceptions';

type DTOConstructor<T extends object> = new (...args: any[]) => T;

export default function DTOValidationMiddleware<T extends object>(
  DTOClass: DTOConstructor<T>
): RequestHandler {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const payload = req.method === 'GET' ? req.query : req.body;
      const dtoObject = plainToInstance(DTOClass, payload);

      const errors: ValidationError[] = await validate(dtoObject, {
        whitelist: true,
        forbidNonWhitelisted: true,
        skipMissingProperties: true
      });

      if (errors.length > 0) {
        const errorMessages = errors.flatMap((error: ValidationError) =>
          Object.values(error.constraints || {})
        );

        return next(new HttpException(400, 'Validation Failure', errorMessages));
      }

      if (req.method === 'GET') {
        req.query = dtoObject as Request['query'];
      } else {
        req.body = dtoObject as T;
      }

      return next();
    } catch (err) {
      return next(
        new HttpException(400, 'Validation Failure', {
          errors: ['Internal server error during validation.']
        })
      );
    }
  };
}