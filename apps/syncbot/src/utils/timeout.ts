export class TimeoutError extends Error {
    constructor() {
        super('timeout');
    }
}

const getTimeout = async (ms: number): Promise<never> => {
    return new Promise((resolve, reject) => {
        const id = setTimeout(() => {
            clearTimeout(id);
            reject(new TimeoutError());
        }, ms);
    });
};

export const timeout = async <T>(
    cb: Promise<T>,
    ms: number,
): Promise<Awaited<T>> => {
    return await Promise.race([cb, getTimeout(ms)]);
};
