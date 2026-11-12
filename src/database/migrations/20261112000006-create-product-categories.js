'use strict';

/** Requisito 06 - tabela de ligação produtos x categorias */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('product_categories', {
      product_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: { model: 'products', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      category_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: { model: 'categories', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
    });

    // Índice para acelerar o filtro de produtos por categoria
    await queryInterface.addIndex('product_categories', ['category_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('product_categories');
  },
};
