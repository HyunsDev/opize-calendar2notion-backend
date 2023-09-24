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

    static create(data: {
        workspaceId: string;
        accessToken: string;
        botId: string;
        tokenType: string;
    }) {
        const notionWorkspace = new NotionWorkspaceEntity();
        notionWorkspace.workspaceId = data.workspaceId;
        notionWorkspace.accessToken = data.accessToken;
        notionWorkspace.botId = data.botId;
        notionWorkspace.tokenType = data.tokenType;

        return notionWorkspace;
    }
}
