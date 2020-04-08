import {ICommandHandler, CommandHandler} from '@nestjs/cqrs';
import {Dependencies} from '@nestjs/common';
import {DATABASE} from '../../constants';
import {UpdateLinkCommand} from './updateLink.command';
import {Cosmos} from '../cosmos/cosmos';
import {LINKS, Link} from './link';

@CommandHandler(UpdateLinkCommand)
@Dependencies(DATABASE)
export class UpdateLinkHandler implements ICommandHandler<UpdateLinkCommand> {
  constructor(private readonly cosmos: Cosmos) {}

  async execute(command: UpdateLinkCommand): Promise<Link> {
    await this.cosmos.replace(LINKS, command.link);

    return command.link;
  }
}
