import { CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

// TODO: switch to Redis?
@Entity('denied_tokens')
export class DeniedTokens {
  @PrimaryColumn('uuid')
  jti: string;

  @PrimaryColumn('text')
  iss: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: string;
}
