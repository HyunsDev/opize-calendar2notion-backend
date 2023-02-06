import { Runner } from './runner';
import app from './server';

const PORT = +process.env.PORT || 3004;

export const manager = async () => {
    const runner = new Runner();
    const server = app;
    server.listen(PORT, () => {
        console.log('SERVER START');
    });
    await runner.run();
};
