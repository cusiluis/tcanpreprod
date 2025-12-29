import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import Role from './Role';

export class Usuario extends Model {
  public id!: number;
  public nombre_usuario!: string;
  public correo!: string;
  public contrasena_hash!: string;
  public nombre_completo!: string;
  public rol_id!: number;
  public telefono?: string;
  public esta_activo!: boolean;
  public fecha_creacion!: Date;
  public fecha_actualizacion!: Date;
}

Usuario.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombre_usuario: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    correo: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true
    },
    contrasena_hash: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    nombre_completo: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    rol_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Role,
        key: 'id'
      }
    },
    telefono: {
      type: DataTypes.STRING(20),
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
    tableName: 'usuarios',
    timestamps: false
  }
);

Usuario.belongsTo(Role, { foreignKey: 'rol_id' });

export default Usuario;
