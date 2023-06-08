import {PrismaClient} from '@prisma/client';
import * as data from './data/load.json';

interface Item {
  id: string;
  url: string;
  title: string;
  description: string;
  tags: string[];
  image: string;
}

const prisma = new PrismaClient();

async function main() {
  for (const item of data.reverse()) {
    let link = await prisma.link.findFirst({
      where: {
        url: item.url,
      },
    });

    if (!link) {
      const image_url = item.image?.startsWith('data:image') ? '' : item.image;

      link = await prisma.link.create({
        data: {
          url: item.url,
          title: item.title,
          description: item.description,
          image_url,

          create_date: new Date(),
          update_date: new Date(),
        },
      });

      console.log(`Created link: ${link.title}`);
    }

    // tags
    for (const text of item.tags) {
      let tag = await prisma.tag.findFirst({
        where: {
          text,
        },
      });

      if (!tag) {
        tag = await prisma.tag.create({
          data: {
            text,

            create_date: new Date(),
            update_date: new Date(),
          },
        });

        console.log(`Created tag: ${tag.text}`);
      }

      const link_tag = await prisma.link_tag.findFirst({
        where: {
          link_id: link.id,
          tag_id: tag.id,
        },
      });

      if (!link_tag) {
        await prisma.link_tag.create({
          data: {
            link_id: link.id,
            tag_id: tag.id,
          },
        });

        console.log(`Linked ${link.title} to tag: ${tag.text}`);
      }
    }
  }
}

main();
