import {
    Column,
    CreateDateColumn,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';

@Entity('notion_workspace')
export class NotionWorkspaceEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 300 })
    workspaceId: string;

    @Column({ length: 300 })
    accessToken: string;

    @Column({ length: 300 })
    botId: string;

    @Column({ length: 300 })
    tokenType: string;

    @OneToMany(() => UserEntity, (user) => user.notionWorkspace)
    users: UserEntity[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    constructor(data: {
        workspaceId: string;
        accessToken: string;
        botId: string;
        tokenType: string;
    }) {
        if (!data) return;
        this.workspaceId = data.workspaceId;
        this.accessToken = data.accessToken;
        this.botId = data.botId;
        this.tokenType = data.tokenType;
    }
}
