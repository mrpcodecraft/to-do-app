import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from "sequelize";
import Database from "../../../Config/database";

const sequelize = Database.getInstance().sequelize;

export class Token extends Model<
  InferAttributes<Token>,
  InferCreationAttributes<Token>
> {
  declare tokenId: string;
  declare userId: string;
  declare tokenHash: string;
  declare deviceId: string;
  declare lastUsedAt: Date;
  declare expiresAt: Date;
  declare revokedAt: Date | null;
}

Token.init(
  {
    tokenId: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    tokenHash: {
      type: DataTypes.STRING(500),
      allowNull: false,
      unique: true,
    },
    deviceId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastUsedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    revokedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "tokens",
    timestamps: true,
  }
);

export default Token;
