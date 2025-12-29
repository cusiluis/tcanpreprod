import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import Usuario from './Usuario';

export enum TipoEvento {
  ACCION = 'ACCION',
  NAVEGACION = 'NAVEGACION'
}

export enum AccionEvento {
  CREAR = 'CREAR',
  ACTUALIZAR = 'ACTUALIZAR',
  ELIMINAR = 'ELIMINAR',
  INICIO_SESION = 'INICIO_SESION',
  VER = 'VER',
  EDITAR = 'EDITAR',
  VERIFICAR_PAGO = 'VERIFICAR_PAGO'
}

export class Evento extends Model {
  public id!: number;
  public usuario_id?: number;
  public tipo_evento!: TipoEvento;
  public accion?: AccionEvento;
  public tipo_entidad?: string;
  public entidad_id?: number;
  public descripcion!: string;
  public direccion_ip?: string;
  public agente_usuario?: string;
  public fecha_creacion!: Date;
}

Evento.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: Usuario,
        key: 'id'
      }
    },
    tipo_evento: {
      type: DataTypes.ENUM(...Object.values(TipoEvento)),
      allowNull: false
    },
    accion: {
      type: DataTypes.ENUM(...Object.values(AccionEvento)),
      allowNull: true
    },
    tipo_entidad: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    entidad_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    direccion_ip: {
      type: DataTypes.STRING(45),
      allowNull: true
    },
    agente_usuario: {
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
    tableName: 'eventos',
    timestamps: false
  }
);

Evento.belongsTo(Usuario, { foreignKey: 'usuario_id' });

export default Evento;
