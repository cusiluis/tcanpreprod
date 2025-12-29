import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export class Cliente extends Model {
  public id!: number;
  public nombre!: string;
  public ubicacion?: string;
  public telefono?: string;
  public correo?: string;
  public esta_activo!: boolean;
  public fecha_creacion!: Date;
  public fecha_actualizacion!: Date;
}

Cliente.init(
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
    ubicacion: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    telefono: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    correo: {
      type: DataTypes.STRING(255),
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
    tableName: 'clientes',
    timestamps: false
  }
);

export default Cliente;
