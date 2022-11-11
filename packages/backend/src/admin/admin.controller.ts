import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { Auth } from 'src/user/decorator/auth.decorator';
import { AdminService } from './admin.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { FindUserDto } from './dto/find-user.dto';
import { UserPlanUpgradeDto } from './dto/plan-upgrade.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('admin')
@Auth('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('find-user')
  async findUser(@Query() query: FindUserDto) {
    return await this.adminService.findUser({
      email: query.email,
      googleEmail: query.googleEmail,
      id: query.id ? +query.id : undefined,
      opizeId: query.opizeId ? +query.opizeId : undefined,
    });
  }

  @Get('working-users')
  async findWorkingUsers() {
    return await this.adminService.findWorkingUsers();
  }

  @Get('user/:id')
  async getUser(@Param('id') id: string) {
    return await this.adminService.findUser({
      id: +id,
    });
  }

  @Delete('user/:id')
  async deleteUser(@Param('id') id: string) {
    return '';
  }

  @Patch('user/:id')
  async updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return await this.adminService.updateUser(+id, dto);
  }

  @Post('user/:id/plan')
  async planUpdate(@Param('id') id: string, @Body() dto: UserPlanUpgradeDto) {
    return await this.adminService.planUpgrade(+id, dto);
  }

  @Get('statistics')
  async statistics() {
    return await this.adminService.statistics();
  }
}
