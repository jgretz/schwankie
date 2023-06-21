import {Body, Delete, Get, Param, Post, Put} from '@nestjs/common';
import {CrudService} from '../../Types';

interface IdParam {
  id: string;
}

export class CrudController<T, CT, UT> {
  private service: CrudService<T, CT, UT>;

  constructor(service: CrudService<T, CT, UT>) {
    this.service = service;
  }

  @Get(':id')
  async find(@Param() {id}: IdParam) {
    return this.service.find(parseInt(id, 10));
  }

  @Get()
  async findAll() {
    return this.service.findAll();
  }

  @Post()
  async create(@Body() dto: CT) {
    return await this.service.create(dto);
  }

  @Put()
  async update(@Body() dto: UT) {
    return await this.service.update(dto);
  }

  @Delete(':id')
  async delete(@Param() {id}: IdParam) {
    return await this.service.delete(parseInt(id, 10));
  }
}
