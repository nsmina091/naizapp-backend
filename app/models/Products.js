const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Products = sequelize.define('product', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true ,
        allowNull: false 
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false 
    },
    description: {
        type: DataTypes.STRING,
        allowNull: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    tax_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    added_by: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    // category: {
    //     type: DataTypes.STRING, 
    //     allowNull: true
    // }
}, );

module.exports = Products;
