import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export class Proveedor extends Model {
  public id!: number;
  public nombre!: string;
  public servicio!: string;
  public telefono?: string;
  public telefono2?: string;
  public correo?: string;
  public correo2?: string;
  public descripcion?: string;
  public esta_activo!: boolean;
  public fecha_creacion!: Date;
  public fecha_actualizacion!: Date;
}

Proveedor.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    servicio: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    telefono: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    telefono2: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    correo: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    correo2: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    esta_activo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
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
    tableName: 'proveedores',
    timestamps: false
  }
);

export default Proveedor;
