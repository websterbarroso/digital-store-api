'use strict';

const bcrypt = require('bcryptjs');

/**
 * Dados iniciais para demonstração: 1 usuário, categorias e produtos
 * (com imagens, opções e categorias). As imagens ficam em public/media/seed.
 */
const now = new Date();

const categories = [
  { id: 1, name: 'Tênis', slug: 'tenis', use_in_menu: true },
  { id: 2, name: 'Camisetas', slug: 'camisetas', use_in_menu: true },
  { id: 3, name: 'Calças', slug: 'calcas', use_in_menu: true },
  { id: 4, name: 'Bonés', slug: 'bones', use_in_menu: true },
  { id: 5, name: 'Headphones', slug: 'headphones', use_in_menu: false },
  { id: 6, name: 'Ofertas', slug: 'ofertas', use_in_menu: false },
];

const brands = ['K-Swiss V8', 'Nike Revolution 6', 'Adidas Ultraboost', 'Puma RS-X', 'Asics Gel'];
const genders = ['Masculino', 'Feminino', 'Unissex'];

// 16 tênis de exemplo
const products = Array.from({ length: 16 }, (_, i) => {
  const id = i + 1;
  const brand = brands[i % brands.length];
  const gender = genders[i % genders.length];
  const price = [200, 219.9, 349.9, 129.9, 499.9][i % 5];
  const hasDiscount = i % 2 === 0;
  return {
    id,
    enabled: true,
    name: `${brand} - Tênis ${gender}`,
    slug: `${brand.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${gender.toLowerCase()}-${id}`,
    use_in_menu: false,
    stock: 10 + i,
    description:
      'Tênis confortável e resistente, ideal para o dia a dia e para a prática de esportes. '
      + 'Cabedal em material respirável e solado com amortecimento.',
    price,
    price_with_discount: hasDiscount ? Number((price * 0.75).toFixed(2)) : price,
    created_at: now,
    updated_at: now,
  };
});

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('users', [{
      id: 1,
      firstname: 'Admin',
      surname: 'Digital Store',
      email: 'admin@digitalstore.com',
      password: await bcrypt.hash('123@123', 10),
      created_at: now,
      updated_at: now,
    }]);

    await queryInterface.bulkInsert(
      'categories',
      categories.map((c) => ({ ...c, created_at: now, updated_at: now })),
    );

    await queryInterface.bulkInsert('products', products);

    // Imagens: 1 thumb + 4 imagens de galeria por produto
    const images = [];
    products.forEach((p, i) => {
      images.push({ product_id: p.id, enabled: true, path: `seed/product-thumb-${(i % 5) + 1}.jpeg` });
      for (let n = 1; n <= 4; n += 1) {
        images.push({ product_id: p.id, enabled: true, path: `seed/produc-image-${((i + n) % 5) + 1}.jpeg` });
      }
    });
    await queryInterface.bulkInsert('product_images', images);

    // Opções: tamanho (texto) e cor
    const options = [];
    products.forEach((p) => {
      options.push({
        product_id: p.id, title: 'Tamanho', shape: 'square', radius: 4, type: 'text', values: '39,40,41,42,43',
      });
      options.push({
        product_id: p.id, title: 'Cor', shape: 'circle', radius: 0, type: 'color', values: '#6FEEFF,#FF6969,#5E5E5E,#6D70B7',
      });
    });
    await queryInterface.bulkInsert('product_options', options);

    // Categorias: todos são Tênis; produtos com desconto também estão em Ofertas
    const links = [];
    products.forEach((p) => {
      links.push({ product_id: p.id, category_id: 1 });
      if (p.price_with_discount < p.price) links.push({ product_id: p.id, category_id: 6 });
    });
    await queryInterface.bulkInsert('product_categories', links);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('product_categories', null, {});
    await queryInterface.bulkDelete('product_options', null, {});
    await queryInterface.bulkDelete('product_images', null, {});
    await queryInterface.bulkDelete('products', null, {});
    await queryInterface.bulkDelete('categories', null, {});
    await queryInterface.bulkDelete('users', null, {});
  },
};
