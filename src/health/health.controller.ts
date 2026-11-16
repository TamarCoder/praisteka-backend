import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/public.decorator.js';

// Used by Docker HEALTHCHECK. Public on purpose: it returns no data.
@Public()
@Controller('health')
export class HealthController {
  @Get()
  check(): { status: 'ok' } {
    return { status: 'ok' };
  }
}
