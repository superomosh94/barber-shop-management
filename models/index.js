const { Sequelize } = require('sequelize');
const sequelize = require('../config/database');

// Import models - use different variable names
const CustomerModel = require('./Customer');
const ServiceModel = require('./Service');
const BarberModel = require('./Barber');
const AppointmentModel = require('./Appointment');
const RatingModel = require('./Rating');
const AdminUserModel = require('./AdminUser'); // Make sure this points to the correct file

// Initialize models
const models = {
    Customer: CustomerModel(sequelize, Sequelize),
    Service: ServiceModel(sequelize, Sequelize),
    Barber: BarberModel(sequelize, Sequelize),
    Appointment: AppointmentModel(sequelize, Sequelize),
    Rating: RatingModel(sequelize, Sequelize),
    AdminUser: AdminUserModel(sequelize, Sequelize)
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