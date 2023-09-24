import { Test, TestingModule } from '@nestjs/testing';

import { SyncbotController } from './syncbot.controller';
import { SyncbotService } from './syncbot.service';

describe('SyncbotController', () => {
    let controller: SyncbotController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [SyncbotController],
            providers: [SyncbotService],
        }).compile();

        controller = module.get<SyncbotController>(SyncbotController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
