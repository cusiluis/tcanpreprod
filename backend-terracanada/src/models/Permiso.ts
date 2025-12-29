import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export class Permiso extends Model {
  public id!: number;
  public nombre!: string;
  public descripcion?: string;
  public modulo!: string;
  public accion!: string;
  public fecha_creacion!: Date;
}

Permiso.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    modulo: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    accion: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    fecha_creacion: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    tableName: 'permisos',
    timestamps: false
  }
);

export default Permiso;
