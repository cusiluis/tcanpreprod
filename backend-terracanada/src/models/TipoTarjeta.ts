import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export class TipoTarjeta extends Model {
  public id!: number;
  public nombre!: string;
  public descripcion?: string;
  public fecha_creacion!: Date;
}

TipoTarjeta.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombre: {
      type: DataTypes.STRING(10),
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
    tableName: 'tipos_tarjeta',
    timestamps: false
  }
);

export default TipoTarjeta;
