import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import dotenv from 'dotenv';
import { connectDatabase } from './config/database';
import { swaggerSpec } from './config/swagger';
import { testProveedorFunctions } from './utils/test-proveedores-debug';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3000;

// Middleware de seguridad
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:4200',
  credentials: true
}));

// Middleware de logging
app.use(morgan('combined'));

// Middleware de parseo
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Documentación Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health Check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Importar rutas
import authRoutes from './routes/authRoutes';
import usuarioRoutes from './routes/usuarioRoutes';
import pagoRoutes from './routes/pagoRoutes';
import clienteRoutes from './routes/clienteRoutes';
import proveedorRoutes from './routes/proveedorRoutes';
import eventoRoutes from './routes/eventoRoutes';
import tarjetaRoutes from './routes/tarjetaRoutes';
import pagoBancarioRoutes from './routes/pagoBancarioRoutes';
import cuentaBancariaRoutes from './routes/cuentaBancariaRoutes';
import debugRoutes from './routes/debugRoutes';
import gmailGenRoutes from './routes/gmailGenRoutes';
import documentoUsuarioRoutes from './routes/documentoUsuarioRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import analisisRoutes from './routes/analisisRoutes';

// Registrar rutas
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/usuarios', usuarioRoutes);
app.use('/api/v1/pagos', pagoRoutes);
app.use('/api/v1/pagos-bancarios', pagoBancarioRoutes);
app.use('/api/v1/cuentas-bancarias', cuentaBancariaRoutes);
app.use('/api/v1/clientes', clienteRoutes);
app.use('/api/v1/proveedores', proveedorRoutes);
app.use('/api/v1/eventos', eventoRoutes);
app.use('/api/v1/tarjetas', tarjetaRoutes);
app.use('/api/v1/debug', debugRoutes);
app.use('/api/v1/gmail-gen', gmailGenRoutes);
app.use('/api/v1/documentos-usuario', documentoUsuarioRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/analisis', analisisRoutes);

// Manejo de errores global
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      status: err.status || 500
    }
  });
});

// Ruta 404
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: {
      message: 'Route not found',
      status: 404
    }
  });
});

// Iniciar servidor
const startServer = async () => {
  try {
    await connectDatabase();
    
    // Ejecutar pruebas de proveedores
    await testProveedorFunctions();
    
    app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════╗
║   Terra Canada API Server Running      ║
║   Port: ${PORT}                          ║
║   Environment: ${process.env.NODE_ENV || 'development'}              ║
║   Docs: http://localhost:${PORT}/api-docs  ║
╚════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
