import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import Pago from './Pago';
import Usuario from './Usuario';

export enum TipoDocumento {
  FACTURA = 'Factura',
  DOCUMENTO_BANCO = 'Documento Banco',
  RECIBO = 'Recibo',
  OTRO = 'Otro'
}

export class Documento extends Model {
  public id!: number;
  public pago_id!: number;
  public tipo_documento!: TipoDocumento;
  public ruta_archivo!: string;
  public nombre_archivo_original!: string;
  public subido_por_usuario_id!: number;
  public fecha_subida!: Date;
}

Documento.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    pago_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Pago,
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    tipo_documento: {
      type: DataTypes.ENUM(...Object.values(TipoDocumento)),
      allowNull: false
    },
    ruta_archivo: {
      type: DataTypes.STRING(1024),
      allowNull: false
    },
    nombre_archivo_original: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    subido_por_usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Usuario,
        key: 'id'
      }
    },
    fecha_subida: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    tableName: 'documentos',
    timestamps: false
  }
);

Documento.belongsTo(Pago, { foreignKey: 'pago_id' });
Documento.belongsTo(Usuario, { foreignKey: 'subido_por_usuario_id' });

export default Documento;
