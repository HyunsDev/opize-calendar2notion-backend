import { Test, TestingModule } from '@nestjs/testing';
import { SyncbotService } from './syncbot.service';

describe('SyncbotService', () => {
  let service: SyncbotService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SyncbotService],
    }).compile();

    service = module.get<SyncbotService>(SyncbotService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
