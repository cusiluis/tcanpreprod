import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import Usuario from './Usuario';
import { EstadoPago } from './Pago';

export class PagoArchivado extends Model {
  public id!: number;
  public pago_original_id!: number;
  public cliente_id!: number;
  public proveedor_id!: number;
  public correo_proveedor!: string;
  public tarjeta_id!: number;
  public monto!: number;
  public numero_presta!: string;
  public comentarios?: string;
  public estado!: EstadoPago;
  public esta_verificado!: boolean;
  public registrado_por_usuario_id!: number;
  public verificado_por_usuario_id?: number;
  public fecha_creacion?: Date;
  public fecha_actualizacion?: Date;
  public fecha_verificacion?: Date;
  public archivado_por_usuario_id!: number;
  public fecha_archivado!: Date;
  public motivo_archivo?: string;
}

PagoArchivado.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    pago_original_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true
    },
    cliente_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    proveedor_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    correo_proveedor: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    tarjeta_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    monto: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    numero_presta: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    comentarios: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    estado: {
      type: DataTypes.ENUM(...Object.values(EstadoPago)),
      allowNull: false
    },
    esta_verificado: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    registrado_por_usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    verificado_por_usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    fecha_creacion: {
      type: DataTypes.DATE,
      allowNull: true
    },
    fecha_actualizacion: {
      type: DataTypes.DATE,
      allowNull: true
    },
    fecha_verificacion: {
      type: DataTypes.DATE,
      allowNull: true
    },
    archivado_por_usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Usuario,
        key: 'id'
      }
    },
    fecha_archivado: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    motivo_archivo: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  },
  {
    sequelize,
    tableName: 'pagos_archivados',
    timestamps: false
  }
);

PagoArchivado.belongsTo(Usuario, { foreignKey: 'archivado_por_usuario_id' });

export default PagoArchivado;
