import { InternalServerErrorException } from '@nestjs/common';
import { UserEntity } from '@opize/calendar2notion-object';

export const getGoogleCalendarTokensByUser = (user: UserEntity) => {
    const callbackUrls = JSON.parse(process.env.GOOGLE_CALLBACKS || '{}');

    const callbackUrl = callbackUrls[String(user.googleRedirectUrlVersion)];

    if (!callbackUrl) {
        throw new InternalServerErrorException({
            message: '콜백 URL을 찾을 수 없습니다.',
            code: 'GOOGLE_CALLBACK_URL_NOT_FOUND',
        });
    }

    return {
        accessToken: user.googleAccessToken,
        refreshToken: user.googleRefreshToken,
        callbackUrl,
    };
};
