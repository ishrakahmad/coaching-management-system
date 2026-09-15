import { Role } from '../../users/enums/role.enum';

// Shape of request.user after JwtStrategy.validate()
export interface AuthUser {
  userId: string;
  email: string;
  role: Role;
  instituteId: string;
}
