import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service.js';
import { AuthUser, JwtPayload } from './auth.types.js';

@Injectable()
export class JwtAuthGuard implements CanActivate {
    constructor(
        private readonly jwtService: JwtService,
        private readonly authService: AuthService,
    ) { }

    async canActivate(context: ExecutionContext) {
        const request = context.switchToHttp().getRequest<{ headers: { authorization?: string }; user: AuthUser }>();
        const token = request.headers.authorization?.replace(/^Bearer\s+/i, '');
        if (!token) throw new UnauthorizedException('Bearer token is required.');

        try {
            const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
            request.user = await this.authService.getAuthenticatedUser(payload.sub);
            return true;
        } catch {
            throw new UnauthorizedException('Invalid or expired token.');
        }
    }
}