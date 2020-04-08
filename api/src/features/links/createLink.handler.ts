import {ICommandHandler, CommandHandler} from '@nestjs/cqrs';
import {Dependencies} from '@nestjs/common';
import {DATABASE} from '../../constants';
import {CreateLinkCommand} from './createLink.command';
import {Cosmos} from '../cosmos/cosmos';
import {LINKS, Link} from './link';

@CommandHandler(CreateLinkCommand)
@Dependencies(DATABASE)
export class CreateLinkHandler implements ICommandHandler<CreateLinkCommand> {
  constructor(private readonly cosmos: Cosmos) {}

  async execute(command: CreateLinkCommand): Promise<Link> {
    return this.cosmos.create<Link>(LINKS, command.link);
  }
}
