import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';

config();

export const dataSourceOptions: DataSourceOptions = {
  type: 'mysql',
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT),
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASS,
  database: process.env.DATABASE_NAME,
  entities: ['dist/frameworks/dataServices/typeorm/entity/*entity{.ts,.js}'],
  migrations: ['dist/frameworks/dataServices/typeorm/migrations/*{.ts,.js}'],
  synchronize: false,
  migrationsRun: true,
};

export default new DataSource(dataSourceOptions);
