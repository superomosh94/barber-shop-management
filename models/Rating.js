const { DataTypes } = require('sequelize');

module.exports = (sequelize, Sequelize) => {
    const Rating = sequelize.define('Rating', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        appointment_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true,
            references: {
                model: 'appointments',
                key: 'id'
            }
        },
        barber_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'barbers',
                key: 'id'
            }
        },
        customer_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'customers',
                key: 'id'
            }
        },
        rating: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: {
                    args: [1],
                    msg: 'Rating must be at least 1'
                },
                max: {
                    args: [5],
                    msg: 'Rating cannot exceed 5'
                },
                isInt: {
                    msg: 'Rating must be an integer'
                }
            }
        },
        review: {
            type: DataTypes.TEXT,
            allowNull: true,
            validate: {
                len: {
                    args: [0, 1000],
                    msg: 'Review cannot exceed 1000 characters'
                }
            }
        },
        is_approved: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        admin_notes: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    }, {
        tableName: 'ratings',
        timestamps: true,
        underscored: true,
        hooks: {
            beforeCreate: async (rating) => {
                // Verify that the appointment exists and is completed
                const appointment = await sequelize.models.Appointment.findByPk(rating.appointment_id);
                if (!appointment) {
                    throw new Error('Appointment not found');
                }
                if (appointment.status !== 'completed') {
                    throw new Error('Can only rate completed appointments');
                }
                if (appointment.customer_id !== rating.customer_id) {
                    throw new Error('You can only rate your own appointments');
                }

                // Check if rating window is still open
                if (!appointment.canBeRated()) {
                    throw new Error('Rating period has expired (7 days after completion)');
                }
            }
        }
    });

    // Associations
    Rating.associate = function(models) {
        Rating.belongsTo(models.Appointment, {
            foreignKey: 'appointment_id',
            as: 'appointment'
        });
        Rating.belongsTo(models.Barber, {
            foreignKey: 'barber_id',
            as: 'barber'
        });
        Rating.belongsTo(models.Customer, {
            foreignKey: 'customer_id',
            as: 'customer'
        });
    };

    return Rating;
};