const { DataTypes } = require('sequelize');

module.exports = (sequelize, Sequelize) => {
    const Service = sequelize.define('Service', {
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
                    msg: 'Service name is required'
                },
                len: {
                    args: [2, 100],
                    msg: 'Service name must be between 2 and 100 characters'
                }
            }
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            validate: {
                isDecimal: {
                    msg: 'Price must be a valid decimal number'
                },
                min: {
                    args: [0],
                    msg: 'Price cannot be negative'
                }
            }
        },
        duration: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 30, // minutes
            validate: {
                isInt: {
                    msg: 'Duration must be an integer'
                },
                min: {
                    args: [15],
                    msg: 'Duration must be at least 15 minutes'
                },
                max: {
                    args: [180],
                    msg: 'Duration cannot exceed 180 minutes'
                }
            }
        },
        image: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        category: {
            type: DataTypes.STRING(50),
            allowNull: false,
            defaultValue: 'haircut'
        }
    }, {
        tableName: 'services',
        timestamps: true,
        underscored: true
    });

    // Associations
    Service.associate = function(models) {
        Service.hasMany(models.Appointment, {
            foreignKey: 'service_id',
            as: 'appointments'
        });
    };

    return Service;
};