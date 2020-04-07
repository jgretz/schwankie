import {Dependencies, Post, Controller, Body, UseGuards} from '@nestjs/common';
import {QueryBus, CommandBus} from '@nestjs/cqrs';
import {AuthorizeUserCommand} from './authorizeUser.command';
import {VerifyTokenCommand} from './verifyToken.command';
import {AuthorizedUserGuard} from './authroizedUser.guard';

@Controller('user')
@Dependencies(QueryBus, CommandBus)
export default class UserController {
  constructor(private queryBus: QueryBus, private commandBus: CommandBus) {}

  @Post('authorize')
  async authorizeUser(@Body('username') username: string, @Body('password') password: string) {
    return this.commandBus.execute(new AuthorizeUserCommand(username, password));
  }

  @UseGuards(new AuthorizedUserGuard())
  @Post('verifytoken')
  async verifytoken(@Body('token') token: string) {
    return this.commandBus.execute(new VerifyTokenCommand(token));
  }
}
