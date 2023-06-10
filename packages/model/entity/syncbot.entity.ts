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

    constructor(
        partial: Omit<SyncBotEntity, 'id' | 'createdAt' | 'updatedAt'>,
    ) {
        Object.assign(this, partial);
    }
}
