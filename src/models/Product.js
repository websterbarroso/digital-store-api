const { DataTypes, Model } = require('sequelize');

/** Produto da loja, com imagens, opções (cor/tamanho) e categorias. */
class Product extends Model {
  static initModel(sequelize) {
    Product.init(
      {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        enabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        name: { type: DataTypes.STRING, allowNull: false },
        slug: { type: DataTypes.STRING, allowNull: false, unique: true },
        use_in_menu: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        stock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        description: { type: DataTypes.STRING, allowNull: true },
        price: { type: DataTypes.FLOAT, allowNull: false },
        price_with_discount: { type: DataTypes.FLOAT, allowNull: false },
      },
      { sequelize, tableName: 'products', timestamps: true },
    );
    return Product;
  }

  static associate(models) {
    Product.hasMany(models.ProductImage, { foreignKey: 'product_id', as: 'images', onDelete: 'CASCADE' });
    Product.hasMany(models.ProductOption, { foreignKey: 'product_id', as: 'options', onDelete: 'CASCADE' });
    Product.belongsToMany(models.Category, {
      through: models.ProductCategory,
      foreignKey: 'product_id',
      otherKey: 'category_id',
      as: 'categories',
    });
  }
}

module.exports = Product;
