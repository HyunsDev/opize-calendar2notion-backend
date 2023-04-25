import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '@opize/calendar2notion-model';
import { Repository } from 'typeorm';

@Injectable()
export class AdminUserService {
  @InjectRepository(UserEntity)
  private usersRepository: Repository<UserEntity>;

  async findUser(option: {
    email?: string;
    googleEmail?: string;
    id?: number;
    opizeId?: number;
  }) {
    const user = await this.usersRepository.findOne({
      where: option,
      relations: ['calendars', 'paymentLogs'],
    });

    if (!user) {
      throw new NotFoundException({ message: '유저를 찾을 수 없습니다.' });
    }

    return {
      user,
    };
  }
}
