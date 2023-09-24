type FetchAllCallback<T> = (nextCursor: string) => Promise<{
    results: T[];
    nextCursor: string;
}>;

export const fetchAll = async <T>(cb: FetchAllCallback<T>) => {
    const results: T[] = [];
    let nextCursor: string;
    do {
        const { results: newResults, nextCursor: newNextCursor } =
            await cb(nextCursor);
        results.push(...newResults);
        nextCursor = newNextCursor;
    } while (nextCursor);
    return results;
};
