// models/AdminUser.js - This should be a Sequelize model file
const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize, Sequelize) => {
    const AdminUser = sequelize.define('AdminUser', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        username: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true
        },
        password: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        email: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true
            }
        },
        role: {
            type: DataTypes.ENUM('super_admin', 'admin', 'manager'),
            defaultValue: 'admin'
        },
        first_name: {
            type: DataTypes.STRING(50),
            allowNull: true
        },
        last_name: {
            type: DataTypes.STRING(50),
            allowNull: true
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        last_login: {
            type: DataTypes.DATE,
            allowNull: true
        },
        permissions: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: {
                appointments: ['read', 'write'],
                services: ['read', 'write'],
                barbers: ['read', 'write'],
                customers: ['read'],
                ratings: ['read', 'write'],
                reports: ['read']
            }
        }
    }, {
        tableName: 'admin_users',
        timestamps: true,
        underscored: true,
        hooks: {
            beforeCreate: async (adminUser) => {
                if (adminUser.password) {
                    adminUser.password = await bcrypt.hash(adminUser.password, 12);
                }
            },
            beforeUpdate: async (adminUser) => {
                if (adminUser.changed('password')) {
                    adminUser.password = await bcrypt.hash(adminUser.password, 12);
                }
            }
        }
    });

    // Instance method to check password
    AdminUser.prototype.checkPassword = async function(candidatePassword) {
        return await bcrypt.compare(candidatePassword, this.password);
    };

    return AdminUser;
};