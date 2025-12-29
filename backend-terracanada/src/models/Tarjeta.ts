import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import TipoTarjeta from './TipoTarjeta';

export class Tarjeta extends Model {
  public id!: number;
  public nombre_titular!: string;
  public numero_tarjeta!: string;
  public limite!: number;
  public saldo!: number;
  public tipo_tarjeta_id!: number;
  public estado_tarjeta_id!: number;
  public fecha_creacion!: Date;
  public fecha_actualizacion!: Date;
}

Tarjeta.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombre_titular: {
      type: DataTypes.STRING,
      allowNull: false
    },
    numero_tarjeta: {
      type: DataTypes.STRING,
      allowNull: false
    },
    limite: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    saldo: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    tipo_tarjeta_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: TipoTarjeta,
        key: 'id'
      }
    },
    estado_tarjeta_id: {
      type: DataTypes.INTEGER,
      allowNull: false
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
    tableName: 'tarjetas',
    timestamps: false
  }
);

Tarjeta.belongsTo(TipoTarjeta, { foreignKey: 'tipo_tarjeta_id' });

export default Tarjeta;
