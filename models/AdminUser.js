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
            unique: {
                msg: 'Username already exists'
            },
            validate: {
                notEmpty: {
                    msg: 'Username is required'
                },
                len: {
                    args: [3, 50],
                    msg: 'Username must be between 3 and 50 characters'
                }
            }
        },
        password: {
            type: DataTypes.STRING(255),
            allowNull: false,
            validate: {
                notEmpty: {
                    msg: 'Password is required'
                },
                len: {
                    args: [6, 255],
                    msg: 'Password must be at least 6 characters long'
                }
            }
        },
        email: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: {
                msg: 'Email already exists'
            },
            validate: {
                isEmail: {
                    msg: 'Please provide a valid email'
                }
            }
        },
        role: {
            type: DataTypes.ENUM('super_admin', 'admin', 'manager'),
            defaultValue: 'admin',
            allowNull: false
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

    // Instance method to sanitize admin data for response
    AdminUser.prototype.toJSON = function() {
        const values = Object.assign({}, this.get());
        delete values.password;
        return values;
    };

    // Instance method to check permissions
    AdminUser.prototype.hasPermission = function(resource, action) {
        if (this.role === 'super_admin') return true;
        
        const userPermissions = this.permissions || {};
        return userPermissions[resource] && userPermissions[resource].includes(action);
    };

    return AdminUser;
};