import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import Cliente from './Cliente';
import Proveedor from './Proveedor';
import Tarjeta from './Tarjeta';
import Usuario from './Usuario';

export enum EstadoPago {
  A_PAGAR = 'A PAGAR',
  PAGADO = 'PAGADO'
}

export class Pago extends Model {
  public id!: number;
  public cliente_id!: number;
  public proveedor_id!: number;
  public correo_proveedor!: string;
  public tarjeta_id!: number;
  public monto!: number;
  public numero_presta!: string;
  public comentarios?: string;
  public estado!: EstadoPago;
  public esta_verificado!: boolean;
  public esta_activo!: boolean;
  public registrado_por_usuario_id!: number;
  public verificado_por_usuario_id?: number;
  public fecha_verificacion?: Date;
  public fecha_creacion!: Date;
  public fecha_actualizacion!: Date;
}

Pago.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    cliente_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Cliente,
        key: 'id'
      }
    },
    proveedor_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Proveedor,
        key: 'id'
      }
    },
    correo_proveedor: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    tarjeta_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Tarjeta,
        key: 'id'
      }
    },
    monto: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        min: 0.01
      }
    },
    numero_presta: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    comentarios: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    estado: {
      type: DataTypes.ENUM(...Object.values(EstadoPago)),
      allowNull: false,
      defaultValue: EstadoPago.A_PAGAR
    },
    esta_verificado: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    esta_activo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    registrado_por_usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Usuario,
        key: 'id'
      }
    },
    verificado_por_usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: Usuario,
        key: 'id'
      }
    },
    fecha_verificacion: {
      type: DataTypes.DATE,
      allowNull: true
    },
    fecha_creacion: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    fecha_actualizacion: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    tableName: 'pagos',
    timestamps: false
  }
);

Pago.belongsTo(Cliente, { foreignKey: 'cliente_id' });
Pago.belongsTo(Proveedor, { foreignKey: 'proveedor_id' });
Pago.belongsTo(Tarjeta, { foreignKey: 'tarjeta_id', as: 'tarjeta' });
Pago.belongsTo(Usuario, { foreignKey: 'registrado_por_usuario_id', as: 'registradoPor' });
Pago.belongsTo(Usuario, { foreignKey: 'verificado_por_usuario_id', as: 'verificadoPor' });

export default Pago;
