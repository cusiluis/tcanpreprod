import { DataTypes, Model, Sequelize } from 'sequelize';

export class PagoBancario extends Model {
  public id!: number;
  public cliente_id!: number;
  public proveedor_id!: number;
  public correo_proveedor!: string;
  public cuenta_bancaria_id!: number;
  public monto!: number;
  public numero_presta!: string;
  public comentarios?: string;
  public estado!: 'A PAGAR' | 'PAGADO';
  public esta_verificado!: boolean;
  public esta_activo!: boolean;
  public registrado_por_usuario_id!: number;
  public verificado_por_usuario_id?: number;
  public fecha_verificacion?: Date;
  public fecha_creacion!: Date;
  public fecha_actualizacion!: Date;
}

export function initPagoBancario(sequelize: Sequelize): void {
  PagoBancario.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      cliente_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'clientes',
          key: 'id',
        },
      },
      proveedor_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'proveedores',
          key: 'id',
        },
      },
      correo_proveedor: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      cuenta_bancaria_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'cuentas_bancarias',
          key: 'id',
        },
      },
      monto: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        validate: {
          min: 0,
        },
      },
      numero_presta: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },
      comentarios: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      estado: {
        type: DataTypes.ENUM('A PAGAR', 'PAGADO'),
        allowNull: false,
        defaultValue: 'A PAGAR',
      },
      esta_verificado: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      esta_activo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      registrado_por_usuario_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'usuarios',
          key: 'id',
        },
      },
      verificado_por_usuario_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'usuarios',
          key: 'id',
        },
      },
      fecha_verificacion: {
        type: DataTypes.DATE,
        allowNull: true,
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
      tableName: 'pagos_bancarios',
      timestamps: false,
    }
  );
}

export default PagoBancario;
