const { DataTypes } = require('sequelize');

module.exports = (sequelize, Sequelize) => {
    const Appointment = sequelize.define('Appointment', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        customer_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'customers',
                key: 'id'
            }
        },
        service_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'services',
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
        appointment_date: {
            type: DataTypes.DATE,
            allowNull: false,
            validate: {
                isDate: {
                    msg: 'Please provide a valid appointment date'
                },
                isFuture(value) {
                    if (new Date(value) < new Date()) {
                        throw new Error('Appointment date must be in the future');
                    }
                }
            }
        },
        status: {
            type: DataTypes.ENUM('pending', 'confirmed', 'completed', 'cancelled', 'no_show'),
            defaultValue: 'pending',
            allowNull: false
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        total_price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        appointment_end: {
            type: DataTypes.DATE,
            allowNull: true
        },
        cancellation_reason: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    }, {
        tableName: 'appointments',
        timestamps: true,
        underscored: true,
        hooks: {
            beforeCreate: async (appointment) => {
                // Calculate appointment end time based on service duration
                const service = await sequelize.models.Service.findByPk(appointment.service_id);
                if (service) {
                    const startTime = new Date(appointment.appointment_date);
                    const endTime = new Date(startTime.getTime() + service.duration * 60000);
                    appointment.appointment_end = endTime;
                }

                // Set total price
                if (service) {
                    appointment.total_price = service.price;
                }
            }
        }
    });

    // Instance method to check if appointment can be cancelled
    Appointment.prototype.canBeCancelled = function() {
        const now = new Date();
        const appointmentTime = new Date(this.appointment_date);
        const hoursDifference = (appointmentTime - now) / (1000 * 60 * 60);
        
        return hoursDifference >= 2; // 2-hour cancellation policy
    };

    // Instance method to check if appointment can be rated
    Appointment.prototype.canBeRated = function() {
        if (this.status !== 'completed') return false;
        
        const completionTime = this.updatedAt;
        const now = new Date();
        const daysDifference = (now - completionTime) / (1000 * 60 * 60 * 24);
        
        return daysDifference <= 7; // 7-day rating window
    };

    // Associations
    Appointment.associate = function(models) {
        Appointment.belongsTo(models.Customer, {
            foreignKey: 'customer_id',
            as: 'customer'
        });
        Appointment.belongsTo(models.Service, {
            foreignKey: 'service_id',
            as: 'service'
        });
        Appointment.belongsTo(models.Barber, {
            foreignKey: 'barber_id',
            as: 'barber'
        });
        Appointment.hasOne(models.Rating, {
            foreignKey: 'appointment_id',
            as: 'rating'
        });
    };

    return Appointment;
};