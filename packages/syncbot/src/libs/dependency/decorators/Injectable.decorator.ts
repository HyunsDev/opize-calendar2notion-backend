import { INJECTABLE_WATERMARK } from '../constant';

export function Injectable(): ClassDecorator {
    return (target: object) => {
        Reflect.defineMetadata(INJECTABLE_WATERMARK, true, target);
    };
}
