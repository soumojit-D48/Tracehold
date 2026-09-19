import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { hash, compare } from 'bcryptjs';
import { UserRole } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { AuthUser } from './auth.types.js';

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
    ) { }

    async register(dto: RegisterDto) {
        const email = dto.email.toLowerCase();
        const existing = await this.prisma.user.findUnique({ where: { email } });
        if (existing) throw new ConflictException('An account with that email already exists.');

        const user = await this.prisma.user.create({
            data: {
                name: dto.name,
                email,
                passwordHash: await hash(dto.password, 12),
                role: UserRole.TENANT,
            },
        });
        return this.issueToken(user);
    }

    async login(dto: LoginDto) {
        const user = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
        if (!user || !(await compare(dto.password, user.passwordHash))) {
            throw new UnauthorizedException('Invalid email or password.');
        }
        return this.issueToken(user);
    }

    async getAuthenticatedUser(id: string): Promise<AuthUser> {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) throw new UnauthorizedException('Authenticated user no longer exists.');
        return { id: user.id, email: user.email, role: user.role };
    }

    private issueToken(user: { id: string; email: string; role: UserRole; name: string }) {
        const userInfo = { id: user.id, name: user.name, email: user.email, role: user.role };
        return {
            accessToken: this.jwtService.sign({ sub: user.id, email: user.email, role: user.role }),
            user: userInfo,
        };
    }
}