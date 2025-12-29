import { DataTypes, Model, Sequelize } from 'sequelize';

export class TipoMoneda extends Model {
  public id!: number;
  public nombre!: string;
  public descripcion?: string;
  public fecha_creacion!: Date;
}

export function initTipoMoneda(sequelize: Sequelize): void {
  TipoMoneda.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      nombre: {
        type: DataTypes.STRING(10),
        allowNull: false,
        unique: true,
      },
      descripcion: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      fecha_creacion: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      tableName: 'tipos_moneda',
      timestamps: false,
    }
  );
}
