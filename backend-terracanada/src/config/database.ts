import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'terra_canada',
  process.env.DB_USER || 'admin',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    timezone: '-04:00',
    dialectOptions: {
      ssl: false
    }
  }
);

export const connectDatabase = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully');
    
    // Sincronizar modelos (comentar en producción)
    // if (process.env.NODE_ENV === 'development') {
    //   await sequelize.sync({ alter: true });
    //   console.log('✅ Database models synchronized');
    // }
  } catch (error) {
    console.warn('⚠️  Database connection failed. Running in mock mode.');
    console.warn('   Make sure to provide DDL and configure .env file');
    // No salir en desarrollo - permitir que el servidor corra sin BD
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

export default sequelize;
