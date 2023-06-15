import {
    APIEmbed,
    APIEmbedAuthor,
    APIEmbedField,
    APIEmbedFooter,
    APIEmbedImage,
    APIEmbedProvider,
    APIEmbedThumbnail,
} from 'discord-api-types/v10';

export class Embed implements APIEmbed {
    title?: string;
    description?: string;
    url?: string;
    timestamp?: string;
    color?: number;
    footer?: APIEmbedFooter;
    image?: APIEmbedImage;
    thumbnail?: APIEmbedThumbnail;
    provider?: APIEmbedProvider;
    author?: APIEmbedAuthor;
    fields?: APIEmbedField[];

    constructor(embed: APIEmbed) {
        for (const data in embed) {
            this[data] = embed[data];
        }
    }
}
