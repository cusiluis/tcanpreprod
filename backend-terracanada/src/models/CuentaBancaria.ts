import { DataTypes, Model, Sequelize } from 'sequelize';
import { TipoMoneda } from './TipoMoneda';

export class CuentaBancaria extends Model {
  public id!: number;
  public numero_cuenta!: string;
  public nombre_banco!: string;
  public titular_cuenta!: string;
  public saldo!: number;
  public limite!: number;
  public tipo_moneda_id!: number;
  public esta_activo!: boolean;
  public fecha_creacion!: Date;
  public fecha_actualizacion!: Date;
  
  // Relación con TipoMoneda
  public tipo_moneda?: TipoMoneda;
}

export function initCuentaBancaria(sequelize: Sequelize): void {
  CuentaBancaria.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      numero_cuenta: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      nombre_banco: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      titular_cuenta: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      saldo: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.0,
        validate: {
          min: 0,
        },
      },
      limite: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        validate: {
          min: 0,
        },
      },
      tipo_moneda_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'tipos_moneda',
          key: 'id',
        },
      },
      esta_activo: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      fecha_creacion: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      fecha_actualizacion: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      tableName: 'cuentas_bancarias',
      timestamps: false,
    }
  );
}

export function associateCuentaBancaria(): void {
  CuentaBancaria.belongsTo(TipoMoneda, {
    foreignKey: 'tipo_moneda_id',
    as: 'tipo_moneda',
  });
}

export default CuentaBancaria;
