/* eslint-disable no-console */
import {ICommandHandler, CommandHandler} from '@nestjs/cqrs';
import {VerifyTokenCommand} from './verifyToken.command';

@CommandHandler(VerifyTokenCommand)
export class VerifyTokenCommandHandler implements ICommandHandler<VerifyTokenCommand> {
  async execute(command: VerifyTokenCommand): Promise<boolean> {
    return process.env.TOKEN === command.token;
  }
}
