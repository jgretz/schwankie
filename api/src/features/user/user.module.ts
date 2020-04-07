import {Module} from '@nestjs/common';
import {CqrsModule} from '@nestjs/cqrs';

import UserController from './user.controller';

import {AuthorizeUserCommandHandler} from './authorizeUser.handler';

@Module({
  imports: [CqrsModule],
  providers: [AuthorizeUserCommandHandler],
  controllers: [UserController],
})
export class UserModule {}
