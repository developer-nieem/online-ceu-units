import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getStatus() {
    return {
      service: '@calace/api',
      status: 'ok',
      message: 'CAL ACE Nursing Academy API foundation',
    };
  }
}
