/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Exclude, Expose } from 'class-transformer';

@Expose()
export class Users {
  @Expose()
  id: string;

  @Expose()
  email: string;

  @Expose()
  username: string;

  @Exclude() // Ẩn password khi trả về client
  password: string;

  @Expose()
  name: string;

  @Expose()
  refreshToken: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
