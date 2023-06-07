import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
} from '@nestjs/common';
import { UserEntity } from '@opize/calendar2notion-model';

import { Webhook, Embed } from '@opize/discord-webhook';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    webhook: Webhook;
    constructor() {
        this.webhook = new Webhook(
            process.env.DISCORD_WEBHOOK_BACKEND_ERROR_URL,
            'Calendar2notion Backend',
            'https://media.discordapp.net/attachments/1115901756539420772/1115901905407844402/OpizeNewIcon.png?width=1024&height=1024',
        );
    }

    async catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const request = ctx.getRequest();
        const response = ctx.getResponse();

        if (exception instanceof HttpException) {
            const status = exception.getStatus();
            const data = exception.getResponse();
            response.status(status).json(data);
        } else {
            response.status(500).json({
                statusCode: 500,
                message: 'Internal server error',
            });

            const user: UserEntity | undefined = request.user;
            const embed: Embed = new Embed({
                title: '알 수 없는 에러가 발생했습니다.',
                fields: [
                    {
                        name: 'Endpoint',
                        value: `\`${request.method} ${request.url}\``,
                    },
                    {
                        name: 'Message',
                        value:
                            (exception as Error)?.message ||
                            '(에러 메세지가 없습니다)',
                    },
                ],
                timestamp: new Date().toISOString(),
                footer: {
                    text: `calendar2notion v${process.env.npm_package_version}`,
                    icon_url:
                        'https://media.discordapp.net/attachments/1115901756539420772/1115901905407844402/OpizeNewIcon.png?width=1024&height=1024',
                },
                color: 0xff0000,
            });

            if (request.body && Object.keys(request.body).length > 0) {
                embed.fields.push({
                    name: 'Body',
                    value: `\`\`\`json\n${JSON.stringify(
                        request.body,
                        null,
                        2,
                    )}\`\`\``,
                });
            }

            if (request.query && Object.keys(request.query).length > 0) {
                embed.fields.push({
                    name: 'Query',
                    value: `\`\`\`json\n${JSON.stringify(
                        request.query,
                        null,
                        2,
                    )}\`\`\``,
                });
            }

            if (user) {
                embed.fields.push({
                    name: 'User',
                    value: `${user.isConnected ? '✅' : '❌'} \`(${
                        user.id
                    })\` ${user.name} (${user.email})`,
                });
                embed.thumbnail = {
                    url: user.imageUrl,
                };
            }

            const embed2 = new Embed({
                description: `\`\`\`${(exception as Error).stack}\`\`\``,
            });

            await this.webhook.send('', [embed, embed2]);
        }
    }
}
