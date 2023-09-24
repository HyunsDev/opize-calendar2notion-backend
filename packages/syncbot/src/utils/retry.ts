export const retry = async <T>(
    func: () => Promise<T> | T,
    maxRetries: number = 3,
    delay: number = 1000,
) => {
    try {
        return await func();
    } catch (err) {
        if (maxRetries > 0) {
            await new Promise((resolve) => setTimeout(resolve, delay));
            return retry(func, maxRetries - 1, delay);
        } else {
            throw err;
        }
    }
};
