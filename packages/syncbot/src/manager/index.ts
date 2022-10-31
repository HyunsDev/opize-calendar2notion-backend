import { Runner } from './runner';
import app from './server';

export const manager = async () => {
    const runner = new Runner();
    const server = app;
    server.listen(3000, () => {
        console.log('SERVER START');
    });
    await runner.run();
};
