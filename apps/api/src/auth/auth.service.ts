import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { createHash, randomUUID, timingSafeEqual } from 'crypto';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RefreshToken } from './entities/refresh-token.entity';

interface TokenPayload {
  sub: string;
  email: string;
  role: string;
  instituteId: string;
  jti?: string;
  exp?: number;
}

// SHA-256, not bcrypt: bcrypt only reads the first 72 bytes, and the first
// 72 bytes of two JWTs for the same user are identical.
function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    @InjectRepository(RefreshToken)
    private refreshTokens: Repository<RefreshToken>,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || !user.isActive) throw new UnauthorizedException('Invalid credentials');
    const passwordMatches = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatches) throw new UnauthorizedException('Invalid credentials');
    return this.issueTokens(user);
  }

  /** Exchanges a valid refresh token for a new token pair and revokes the old one. */
  async refresh(refreshToken: string) {
    const payload = await this.verifyRefreshToken(refreshToken);
    const stored = payload.jti ? await this.refreshTokens.findOne({ where: { id: payload.jti } }) : null;
    if (!stored || stored.userId !== payload.sub) throw new UnauthorizedException('Invalid refresh token');

    if (stored.revokedAt) {
      // A revoked token was used again: it was probably stolen. End every session for this user.
      await this.refreshTokens.update({ userId: stored.userId, revokedAt: IsNull() }, { revokedAt: new Date() });
      throw new UnauthorizedException('Session expired, please log in again');
    }

    const presented = Buffer.from(hashToken(refreshToken));
    const expected = Buffer.from(stored.tokenHash);
    if (presented.length !== expected.length || !timingSafeEqual(presented, expected) || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.usersService.findById(stored.userId);
    if (!user || !user.isActive) throw new UnauthorizedException('Invalid refresh token');

    // Conditional update so two parallel refreshes with the same token can't both succeed.
    const result = await this.refreshTokens.update({ id: stored.id, revokedAt: IsNull() }, { revokedAt: new Date() });
    if (!result.affected) throw new UnauthorizedException('Invalid refresh token');

    return this.issueTokens(user);
  }

  async logout(refreshToken: string) {
    try {
      const payload = await this.verifyRefreshToken(refreshToken);
      if (payload.jti) {
        await this.refreshTokens.update({ id: payload.jti, revokedAt: IsNull() }, { revokedAt: new Date() });
      }
    } catch {
      // Logging out with an already-invalid token is not an error.
    }
    return { success: true };
  }

  private async verifyRefreshToken(token: string): Promise<TokenPayload> {
    try {
      return await this.jwtService.verifyAsync<TokenPayload>(token, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async issueTokens(user: User) {
    const payload: TokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      instituteId: user.instituteId,
    };
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.get('JWT_ACCESS_EXPIRES_IN') || '15m',
    });

    const jti = randomUUID();
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN') || '7d',
      jwtid: jti,
    });
    const { exp } = this.jwtService.decode(refreshToken) as TokenPayload;
    await this.refreshTokens.insert({
      id: jti,
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date((exp as number) * 1000),
    });

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, role: user.role, instituteId: user.instituteId },
    };
  }
}
