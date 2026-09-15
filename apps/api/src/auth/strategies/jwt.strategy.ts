import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Role } from '../../users/enums/role.enum';
import { AuthUser } from '../interfaces/auth-user.interface';

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  instituteId: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthUser> {
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      instituteId: payload.instituteId,
    };
  }
}
