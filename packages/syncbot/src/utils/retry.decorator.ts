import { retry } from './retry';

export function Retry(maxRetries: number = 3, delay: number = 300) {
    return function (
        target: any,
        propertyKey: string,
        descriptor: PropertyDescriptor,
    ) {
        const originalMethod = descriptor.value;
        descriptor.value = async function (...args: any[]) {
            return await retry(
                originalMethod.bind(this, args),
                maxRetries,
                delay,
            );
        };
    };
}
