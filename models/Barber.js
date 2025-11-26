const { DataTypes } = require('sequelize');

module.exports = (sequelize, Sequelize) => {
    const Barber = sequelize.define('Barber', {
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
                    msg: 'Barber name is required'
                },
                len: {
                    args: [2, 100],
                    msg: 'Barber name must be between 2 and 100 characters'
                }
            }
        },
        specialty: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        bio: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        image: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        email: {
            type: DataTypes.STRING(100),
            allowNull: true,
            validate: {
                isEmail: {
                    msg: 'Please provide a valid email'
                }
            }
        },
        phone: {
            type: DataTypes.STRING(20),
            allowNull: true
        },
        experience: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'Years of experience'
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        working_hours: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Stores barber working hours as JSON'
        }
    }, {
        tableName: 'barbers',
        timestamps: true,
        underscored: true
    });

    // Virtual for average rating
    Barber.prototype.getAverageRating = async function() {
        const ratings = await this.getRatings();
        if (ratings.length === 0) return 0;
        
        const total = ratings.reduce((sum, rating) => sum + rating.rating, 0);
        return (total / ratings.length).toFixed(1);
    };

    // Associations
    Barber.associate = function(models) {
        Barber.hasMany(models.Appointment, {
            foreignKey: 'barber_id',
            as: 'appointments'
        });
        Barber.hasMany(models.Rating, {
            foreignKey: 'barber_id',
            as: 'ratings'
        });
    };

    return Barber;
};