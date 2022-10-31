const getTimeout = async (ms: number): Promise<never> => {
    return new Promise((resolve, reject) => {
        const id = setTimeout(() => {
            clearTimeout(id);
            reject(new Error('timeout'));
        }, ms);
    });
};

export const timeout = async <T>(
    cb: Promise<T>,
    ms: number,
): Promise<Awaited<T>> => {
    return await Promise.race([cb, getTimeout(ms)]);
};
