import {
    Column,
    Entity,
    CreateDateColumn,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity('syncbot')
export class SyncBotEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    url: string;

    @Column({ unique: true })
    prefix: string;

    @Column()
    controlSecret: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    static create(data: {
        name: string;
        url: string;
        prefix: string;
        controlSecret: string;
    }) {
        const syncBot = new SyncBotEntity();
        syncBot.name = data.name;
        syncBot.url = data.url;
        syncBot.prefix = data.prefix;
        syncBot.controlSecret = data.controlSecret;

        return syncBot;
    }
}
