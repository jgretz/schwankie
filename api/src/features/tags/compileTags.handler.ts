/* eslint-disable no-console */
import {ICommandHandler, CommandHandler} from '@nestjs/cqrs';
import {Dependencies} from '@nestjs/common';
import {DATABASE} from '../../constants';
import {CompileTagsCommand} from './compileTags.command';
import {Cosmos} from '../cosmos/cosmos';
import {TAGS, Tag} from './tag';
import {LINKS, Link} from '../links';

@CommandHandler(CompileTagsCommand)
@Dependencies(DATABASE)
export class CompileTagsHandler implements ICommandHandler<CompileTagsCommand> {
  constructor(private readonly cosmos: Cosmos) {}

  async execute(): Promise<void> {
    console.log('Getting Links');
    const links = await this.cosmos.query<Link>(LINKS, 'select l.tags from links l');
    const existingTags = await this.cosmos.query<Tag>(TAGS, 'select t.title from tags t');

    console.log('Compiling Tags');
    const tags = {};
    links.forEach((link) => {
      link.tags.forEach((title) => {
        const tag = tags[title];

        if (tag) {
          tag.count += 1;
        } else {
          tags[title] = {
            title,
            count: 1,
          };
        }
      });
    });

    console.log('Creating Tags');

    await Promise.all(
      Object.values(tags).map(async (tag: Tag) => {
        if (existingTags.findIndex((t) => t.title === tag.title) > -1) {
          console.log(`${tag.title} already exists`);
          return;
        }

        try {
          await this.cosmos.create(TAGS, tag);
          console.log(`Created Tag: ${tag.title}`);
        } catch (err) {
          console.error(err);
        }
      }),
    );

    console.log('Done');
  }
}
