import {ZodSchema} from 'zod';
import {GetContainer} from 'injectx';

export function validateContainer(schema: ZodSchema) {
  return schema.parse(GetContainer().resolveAll());
}

export function resolveDependency<T>(name: string | symbol) {
  return GetContainer().resolve<T>(name);
}

export function setDependency(name: string | symbol, value: any) {
  GetContainer().Bind(value, {name});
}
