import {
    Controller,
    Get,
    Post,
    Body,
    Sse,
    Res,
    MessageEvent,
    Headers,
} from '@nestjs/common';
import { SyncbotStreamService } from './syncbotStream.service';
import { LiveCheckDto } from './dto/LiveCheck.dto';
import { Observable, ReplaySubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { Response } from 'express';

@Controller('syncbot/stream')
export class SyncbotStreamController {
    private stream: {
        id: string;
        subject: ReplaySubject<unknown>;
        observer: Observable<unknown>;
    }[] = [];

    constructor(private readonly syncbotService: SyncbotStreamService) {}

    @Get('')
    async() {
        return 'Hello, Opize Stream';
    }

    @Post('message')
    async liveCheck(
        @Body() dto: LiveCheckDto,
        @Headers('authorization') authorization: string,
    ) {
        await this.syncbotService.checkSyncBot(
            dto.prefix,
            authorization.split('Bearer ')[1],
        );
        this.stream.forEach(({ subject }) => subject.next(dto.data));
        return;
    }

    @Sse('sse')
    liveSse(@Res() response: Response): Observable<MessageEvent> {
        const id = SyncbotStreamController.genStreamId();
        response.on('close', () => this.removeStream(id));
        // response.setHeader('Access-Control-Allow-Origin', '*');
        const subject = new ReplaySubject();
        const observer = subject.asObservable();
        this.addStream(subject, observer, id);
        return observer.pipe(
            map(
                (data) =>
                    ({
                        id: `my-stream-id:${id}`,
                        data: data,
                        event: 'syncBot_stream',
                    } as MessageEvent),
            ),
        );
    }

    private addStream(
        subject: ReplaySubject<unknown>,
        observer: Observable<unknown>,
        id: string,
    ): void {
        this.stream.push({
            id,
            subject,
            observer,
        });
    }

    private removeStream(id: string): void {
        this.stream = this.stream.filter((stream) => stream.id !== id);
    }

    private static genStreamId(): string {
        return Math.random().toString(36).substring(2, 15);
    }
}
