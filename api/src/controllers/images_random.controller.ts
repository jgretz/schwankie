import {Controller, Get, Header, StreamableFile} from '@nestjs/common';
import {createReadStream} from 'fs';
import {join} from 'path';

const NO_IMAGE_COUNT = 4;

@Controller('images/random')
export class ImagesRandomController {
  @Get()
  @Header('Content-Type', 'image/png')
  getRandomImage() {
    const index = Math.floor(Math.random() * NO_IMAGE_COUNT);
    const imagePath = join(process.cwd(), 'assets', `no-image-${index}.png`);
    const file = createReadStream(imagePath);

    return new StreamableFile(file);
  }
}
