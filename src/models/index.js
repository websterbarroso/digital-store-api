/**
 * Inicializa todos os models e suas associações em um único lugar.
 */
const sequelize = require('../config/connection');

const User = require('./User');
const Category = require('./Category');
const Product = require('./Product');
const ProductImage = require('./ProductImage');
const ProductOption = require('./ProductOption');
const ProductCategory = require('./ProductCategory');

const models = { User, Category, Product, ProductImage, ProductOption, ProductCategory };

Object.values(models).forEach((model) => model.initModel(sequelize));
Object.values(models).forEach((model) => model.associate && model.associate(models));

module.exports = { sequelize, ...models };
