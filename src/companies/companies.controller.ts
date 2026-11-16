import { Controller, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { UserView } from '../auth/auth.service.js';
import { Company } from './entities/company.entity.js';

// Companies are created together with files; here they are only listed.
@Controller('api/companies')
export class CompaniesController {
  constructor(@InjectRepository(Company) private readonly companies: Repository<Company>) {}

  @Get()
  findAll(@CurrentUser() user: UserView) {
    return this.companies.find({ where: { userId: user.id }, order: { name: 'ASC' } });
  }
}
