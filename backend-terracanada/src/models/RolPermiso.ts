import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import Role from './Role';
import Permiso from './Permiso';

export class RolPermiso extends Model {
  public id!: number;
  public rol_id!: number;
  public permiso_id!: number;
}

RolPermiso.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    rol_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Role,
        key: 'id'
      }
    },
    permiso_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Permiso,
        key: 'id'
      }
    }
  },
  {
    sequelize,
    tableName: 'rol_permisos',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['rol_id', 'permiso_id']
      }
    ]
  }
);

RolPermiso.belongsTo(Role, { foreignKey: 'rol_id' });
RolPermiso.belongsTo(Permiso, { foreignKey: 'permiso_id' });

export default RolPermiso;
