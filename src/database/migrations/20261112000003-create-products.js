'use strict';

/** Requisito 03 - tabela de produtos */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('products', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      enabled: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      name: { type: Sequelize.STRING, allowNull: false },
      slug: { type: Sequelize.STRING, allowNull: false, unique: true },
      use_in_menu: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      stock: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      description: { type: Sequelize.STRING, allowNull: true },
      price: { type: Sequelize.FLOAT, allowNull: false },
      price_with_discount: { type: Sequelize.FLOAT, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    // Índice para acelerar a busca por nome (filtro "match")
    await queryInterface.addIndex('products', ['name']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('products');
  },
};
