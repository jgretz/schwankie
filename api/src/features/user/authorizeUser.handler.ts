/* eslint-disable no-console */
import {ICommandHandler, CommandHandler} from '@nestjs/cqrs';
import {AuthorizeUserCommand} from './authorizeUser.command';

@CommandHandler(AuthorizeUserCommand)
export class AuthorizeUserCommandHandler implements ICommandHandler<AuthorizeUserCommand> {
  async execute(command: AuthorizeUserCommand): Promise<string> {
    if (process.env.USERNAME === command.username && process.env.PASSWORD === command.password) {
      return process.env.TOKEN;
    }

    return null;
  }
}
