const { Sequelize } = require('sequelize');
const sequelize = require('../config/database');

// Import models
const Customer = require('./Customer');
const Service = require('./Service');
const Barber = require('./Barber');
const Appointment = require('./Appointment');
const Rating = require('./Rating');
const AdminUser = require('./AdminUser');

// Initialize models
const models = {
    Customer: Customer(sequelize, Sequelize),
    Service: Service(sequelize, Sequelize),
    Barber: Barber(sequelize, Sequelize),
    Appointment: Appointment(sequelize, Sequelize),
    Rating: Rating(sequelize, Sequelize),
    AdminUser: AdminUser(sequelize, Sequelize)
};

// Define associations
Object.keys(models).forEach(modelName => {
    if (models[modelName].associate) {
        models[modelName].associate(models);
    }
});

models.sequelize = sequelize;
models.Sequelize = Sequelize;

module.exports = models;