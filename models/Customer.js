const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize, Sequelize) => {
    const Customer = sequelize.define('Customer', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            validate: {
                notEmpty: {
                    msg: 'Name is required'
                },
                len: {
                    args: [2, 100],
                    msg: 'Name must be between 2 and 100 characters'
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
                },
                notEmpty: {
                    msg: 'Email is required'
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
        phone: {
            type: DataTypes.STRING(20),
            allowNull: true,
            validate: {
                is: {
                    args: /^[\+]?[1-9][\d]{0,15}$/,
                    msg: 'Please provide a valid phone number'
                }
            }
        },
        avatar: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        last_login: {
            type: DataTypes.DATE,
            allowNull: true
        }
    }, {
        tableName: 'customers',
        timestamps: true,
        underscored: true,
        hooks: {
            beforeCreate: async (customer) => {
                if (customer.password) {
                    customer.password = await bcrypt.hash(customer.password, 12);
                }
            },
            beforeUpdate: async (customer) => {
                if (customer.changed('password')) {
                    customer.password = await bcrypt.hash(customer.password, 12);
                }
            }
        }
    });

    // Instance method to check password
    Customer.prototype.checkPassword = async function(candidatePassword) {
        return await bcrypt.compare(candidatePassword, this.password);
    };

    // Instance method to sanitize user data for response
    Customer.prototype.toJSON = function() {
        const values = Object.assign({}, this.get());
        delete values.password;
        return values;
    };

    // Associations
    Customer.associate = function(models) {
        Customer.hasMany(models.Appointment, {
            foreignKey: 'customer_id',
            as: 'appointments'
        });
        Customer.hasMany(models.Rating, {
            foreignKey: 'customer_id',
            as: 'ratings'
        });
    };

    return Customer;
};