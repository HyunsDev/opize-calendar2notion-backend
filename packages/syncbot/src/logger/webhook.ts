import { Webhook } from '@opize/discord-webhook';
import { ENV } from '../../src/env/env';

const noticeWebhook = new Webhook(
    process.env.DISCORD_WEBHOOK_NOTICE_URL,
    'Calendar2notion Notice',
    ENV.DISCORD_WEBHOOK_ICON_URL,
);

export const webhook = {
    notice: noticeWebhook,
};
