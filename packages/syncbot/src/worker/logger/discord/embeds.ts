import { Embed } from '@hyunsdev/discord-webhook';
import { ErrorLogEntity, UserEntity } from '@opize/calendar2notion-model';

import { SyncError } from '../../../worker/error/error';

export const getSyncFailEmbed = (
    user: UserEntity,
    errorLog: ErrorLogEntity,
    err: SyncError,
): Embed => {
    const embed = new Embed({
        title: '동기화 실패',
        description: `**${user.name}**님의 동기화가 실패하였습니다. \`로그 ID: ${errorLog.id}\``,
        fields: [
            {
                name: '오류 코드',
                value: `\`${err.code}\``,
                inline: true,
            },

            {
                name: '오류 설명',
                value: err.description,
            },
            {
                name: '오류 발생 위치',
                value: `\`${err.from}\``,
                inline: true,
            },
            {
                name: 'level',
                value: `\`${err.level}\``,
                inline: true,
            },
            {
                name: 'finishWork',
                value: `\`${err.finishWork}\``,
                inline: true,
            },
            {
                name: 'User',
                value: ` \`(${user.id})\` ${user.name} (${user.email})`,
            },
        ],
        color: 0xff0000,
        thumbnail: {
            url: user.imageUrl,
        },
        timestamp: new Date().toISOString(),
        footer: {
            text: `calendar2notion v${process.env.npm_package_version}`,
            icon_url: process.env.DISCORD_WEBHOOK_ICON_URL,
        },
    });
    return embed;
};

export const getUnknownSyncFailEmbed = (
    user: UserEntity,
    errorLog: ErrorLogEntity,
    err: any,
): Embed => {
    const embed = new Embed({
        title: '알 수 없는 오류 동기화 실패',
        description: `**${user.name}**님의 동기화가 알 수 없는 오류로 실패하였습니다. 로그 ID: \`${errorLog.id}\``,
        fields: [
            {
                name: '오류 코드',
                value: '`unknown_error`',
            },
            {
                name: '오류 상세',
                value: `\`${err.message}\``,
            },
            {
                name: 'level',
                value: '`CRIT`',
                inline: true,
            },
            {
                name: 'finishWork',
                value: '`STOP`',
                inline: true,
            },
            {
                name: 'User',
                value: ` \`(${user.id})\` ${user.name} (${user.email})`,
            },
        ],
        color: 0xff0000,
        thumbnail: {
            url: user.imageUrl,
        },
        timestamp: new Date().toISOString(),
        footer: {
            text: `calendar2notion v${process.env.npm_package_version}`,
            icon_url: process.env.DISCORD_WEBHOOK_ICON_URL,
        },
    });

    return embed;
};
