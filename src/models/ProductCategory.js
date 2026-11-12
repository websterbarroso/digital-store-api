const { DataTypes, Model } = require('sequelize');

/** Tabela de ligação N:N entre produtos e categorias. */
class ProductCategory extends Model {
  static initModel(sequelize) {
    ProductCategory.init(
      {
        product_id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
        category_id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
      },
      { sequelize, tableName: 'product_categories', timestamps: false },
    );
    return ProductCategory;
  }
}

module.exports = ProductCategory;
