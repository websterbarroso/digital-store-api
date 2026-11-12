const { DataTypes, Model } = require('sequelize');

/**
 * Imagem de um produto. "path" guarda o caminho relativo do arquivo salvo
 * no servidor (pasta public/media) ou uma URL absoluta externa.
 */
class ProductImage extends Model {
  static initModel(sequelize) {
    ProductImage.init(
      {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        product_id: { type: DataTypes.INTEGER, allowNull: false },
        enabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        path: { type: DataTypes.STRING, allowNull: false },
      },
      { sequelize, tableName: 'product_images', timestamps: false },
    );
    return ProductImage;
  }

  static associate(models) {
    ProductImage.belongsTo(models.Product, { foreignKey: 'product_id', as: 'product' });
  }
}

module.exports = ProductImage;
