const { DataTypes, Model } = require('sequelize');

/**
 * Usuário da loja. A senha é sempre armazenada como hash (bcrypt).
 * O defaultScope remove a senha de todas as consultas; use o scope
 * "withPassword" quando precisar validar o login.
 */
class User extends Model {
  static initModel(sequelize) {
    User.init(
      {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        firstname: { type: DataTypes.STRING, allowNull: false },
        surname: { type: DataTypes.STRING, allowNull: false },
        email: { type: DataTypes.STRING, allowNull: false, unique: true },
        password: { type: DataTypes.STRING, allowNull: false },
      },
      {
        sequelize,
        tableName: 'users',
        timestamps: true,
        defaultScope: { attributes: { exclude: ['password'] } },
        scopes: { withPassword: { attributes: { include: ['password'] } } },
      },
    );
    return User;
  }
}

module.exports = User;
