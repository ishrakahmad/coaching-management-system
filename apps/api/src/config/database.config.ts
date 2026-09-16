import { join } from 'path';
import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export default registerAs(
  'database',
  (): TypeOrmModuleOptions => ({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'coaching_management',
    autoLoadEntities: true,
    // Schema changes now go through migrations (src/database/migrations).
    // synchronize would silently drop columns that are renamed or removed.
    synchronize: false,
    migrations: [join(__dirname, '..', 'database', 'migrations', '*.{ts,js}')],
    // Pending migrations run automatically when the API starts.
    // Set DB_MIGRATIONS_RUN=false to run them manually with `npm run migration:run`.
    migrationsRun: process.env.DB_MIGRATIONS_RUN !== 'false',
    logging: process.env.DB_LOGGING === 'true' ? true : ['error', 'migration'],
  }),
);
