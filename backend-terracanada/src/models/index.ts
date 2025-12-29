// Exportar todos los modelos
export { Role } from './Role';
export { Usuario } from './Usuario';
export { Cliente } from './Cliente';
export { Proveedor } from './Proveedor';
export { TipoTarjeta } from './TipoTarjeta';
export { Tarjeta } from './Tarjeta';
export { CuentaBancaria } from './CuentaBancaria';
export { Pago, EstadoPago } from './Pago';
export { Documento, TipoDocumento } from './Documento';
export { Evento, TipoEvento, AccionEvento } from './Evento';
export { PagoArchivado } from './PagoArchivado';

// Importar para inicializar relaciones
import Role from './Role';
import Usuario from './Usuario';
import Cliente from './Cliente';
import Proveedor from './Proveedor';
import TipoTarjeta from './TipoTarjeta';
import Tarjeta from './Tarjeta';
import CuentaBancaria, { associateCuentaBancaria } from './CuentaBancaria';
import Pago from './Pago';
import Documento from './Documento';
import Evento from './Evento';
import PagoArchivado from './PagoArchivado';
import { TipoMoneda } from './TipoMoneda';

// Inicializar todas las relaciones
export const initializeModels = () => {
  // Inicializar relaciones
  associateCuentaBancaria();
  
  // Esta función es para asegurar que todos los modelos se carguen
  return {
    Role,
    Usuario,
    Cliente,
    Proveedor,
    TipoTarjeta,
    Tarjeta,
    CuentaBancaria,
    Pago,
    Documento,
    Evento,
    PagoArchivado,
    TipoMoneda
  };
};
