import axios from 'axios';
import { WebhookError } from './error';
import {
    APIActionRowComponent,
    APIAllowedMentions,
    APIEmbed,
    APIMessageActionRowComponent,
} from 'discord-api-types/v10';

export class Webhook {
    url: string;
    userName?: string;
    avatarUrl?: string;

    constructor(url: string, userName?: string, avatarUrl?: string) {
        this.url = url;
        this.userName = userName;
        this.avatarUrl = avatarUrl;
    }

    async get() {
        try {
            return await axios.get(this.url);
        } catch (err) {
            throw new WebhookError(err.response.data);
        }
    }

    async send(
        content: string,
        embeds: APIEmbed[] = [],
        allowedMentions: APIAllowedMentions = {},
        tts = false,
        components: APIActionRowComponent<APIMessageActionRowComponent>[] = [],
    ) {
        try {
            await axios.post(this.url, {
                content: content,
                username: this.userName,
                avatar_url: this.avatarUrl,
                tts: tts,
                embeds: embeds,
                allowed_mentions: allowedMentions,
                components,
            });
        } catch (err) {
            throw new WebhookError(err.response.data);
        }
    }
}
