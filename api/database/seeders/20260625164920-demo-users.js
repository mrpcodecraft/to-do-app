"use strict";

const bcrypt = require("bcrypt");

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('users', [
      {
        email: 'john.doe@example.com',
        name: 'John Doe',
        phone_number: '1234567890',
        password: bcrypt.hashSync('password123', 10),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', { email: 'john.doe@example.com' }, {});
  }
};
