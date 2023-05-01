export function pick<T extends Record<string, any>, K extends keyof T>(
    obj: T,
    keys: K[],
): Pick<T, K> {
    return Object.entries(obj).reduce((acc, [key, value]) => {
        if (keys.includes(key as K)) {
            acc[key as K] = value;
        }
        return acc;
    }, {} as Pick<T, K>);
}
