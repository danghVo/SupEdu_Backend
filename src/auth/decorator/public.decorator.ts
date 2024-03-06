import { Reflector } from '@nestjs/core';

export const Public = Reflector.createDecorator({ transform: (value) => true });
