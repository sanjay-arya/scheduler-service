import { MigrationInterface, QueryRunner } from "typeorm";

export class SchedulerService1696152020832 implements MigrationInterface {
    name = 'SchedulerService1696152020832'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`schedule\` (\`id\` int NOT NULL AUTO_INCREMENT, \`serviceName\` varchar(255) NOT NULL, \`jobName\` varchar(255) NOT NULL, \`jobDescription\` varchar(255) NOT NULL, \`cronTime\` varchar(255) NOT NULL, \`data\` json NOT NULL, \`triggerMethod\` varchar(255) NOT NULL, \`kafkaTopic\` varchar(255) NULL, \`webhookUrl\` varchar(255) NULL, \`retry\` tinyint NOT NULL DEFAULT 0, \`isOnce\` tinyint NOT NULL DEFAULT 0, \`isError\` tinyint NOT NULL DEFAULT 0, \`isActive\` tinyint NOT NULL DEFAULT 1, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`schedule\``);
    }

}
