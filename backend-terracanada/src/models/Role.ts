import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export class Role extends Model {
  public id!: number;
  public nombre!: string;
  public descripcion?: string;
  public fecha_creacion!: Date;
}

Role.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombre: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    fecha_creacion: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    tableName: 'roles',
    timestamps: false
  }
);

export default Role;
