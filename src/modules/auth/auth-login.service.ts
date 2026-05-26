import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthRepository } from './auth.repository';

@Injectable()
export class AuthLoginService {
  private readonly DUMMY_PASSWORD_HASH =
    '$2b$12$0/c.N.d.E.f.G.h.I.j.K.L.m.N.o.P.q.R.s.T.u.V.w.X.y.Z.a.B.c';

  constructor(private readonly authRepository: AuthRepository) {}

  async validateCredentials(email: string, password: string) {
    const user = await this.authRepository.findUserByEmail(email);

    if (!user) {
      await bcrypt.compare(password, this.DUMMY_PASSWORD_HASH);
      throw new UnauthorizedException({ error: 'INVALID_CREDENTIALS' });
    }

    if (!user.is_active || user.status !== 'ACTIVE' || user.deletedAt) {
      throw new ForbiddenException({ error: 'ACCOUNT_INACTIVE' });
    }

    const isPasswordMatching = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordMatching) {
      throw new UnauthorizedException({ error: 'INVALID_CREDENTIALS' });
    }

    return user;
  }
}
