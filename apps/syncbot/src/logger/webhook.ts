import { Webhook } from '@hyunsdev/discord-webhook';
import { env } from '@/env/env';

const noticeWebhook = new Webhook(
    env.DISCORD_WEBHOOK_NOTICE_URL,
    'Calendar2notion Notice',
    env.DISCORD_WEBHOOK_ICON_URL,
);

const errorWebhook = new Webhook(
    env.DISCORD_WEBHOOK_ERROR_URL,
    'Calendar2notion Error',
    env.DISCORD_WEBHOOK_ICON_URL,
);

export const webhook = {
    notice: noticeWebhook,
    error: errorWebhook,
};
