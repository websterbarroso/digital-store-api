const { DataTypes, Model } = require('sequelize');

/**
 * Opção de um produto (ex.: Tamanho, Cor).
 * "values" guarda todas as opções separadas por vírgula (ex.: "P,M,G").
 */
class ProductOption extends Model {
  static initModel(sequelize) {
    ProductOption.init(
      {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        product_id: { type: DataTypes.INTEGER, allowNull: false },
        title: { type: DataTypes.STRING, allowNull: false },
        shape: { type: DataTypes.ENUM('square', 'circle'), allowNull: false, defaultValue: 'square' },
        radius: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        type: { type: DataTypes.ENUM('text', 'color'), allowNull: false, defaultValue: 'text' },
        values: { type: DataTypes.STRING, allowNull: false },
      },
      { sequelize, tableName: 'product_options', timestamps: false },
    );
    return ProductOption;
  }

  static associate(models) {
    ProductOption.belongsTo(models.Product, { foreignKey: 'product_id', as: 'product' });
  }
}

module.exports = ProductOption;
