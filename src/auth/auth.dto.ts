import { Exclude } from 'class-transformer';
import { IsEmail } from 'class-validator';

import { User } from '../entities/user.entity.js';

export class LoginDto {
  @IsEmail()
  email: string;

  // TODO: password
}

export class LoginUserResponse {
  @Exclude()
  passwordHash: string;

  @Exclude()
  passwordSalt: string;

  @Exclude()
  deletedAt: string;

  constructor(partial: Partial<User>) {
    Object.assign(this, partial);
  }
}
