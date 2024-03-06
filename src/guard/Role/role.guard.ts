import { Reflector } from '@nestjs/core';
import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Role } from './role.decorator';

export class RoleGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const role = this.reflector.get(Role, context.getHandler());

        if (!role) return true;

        const request = context.switchToHttp().getRequest();
        const user = request.user;

        return role === user.role ? true : false;
    }
}
