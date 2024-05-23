const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const validator = require('validator');
const sequelize = require('../../config/database');

exports.listProducts = async (req, res, next) => {
    try {
        let page = parseInt(req.query.page) || 1;
        let limit = parseInt(req.query.limit) || 10;
        let offset = (page - 1) * limit;
        let search = req.query.key || '';
        let categoryId = req.query.category_id || '';
        let sql;

        sql = `
        SELECT 
            ps.id,
            ps.product_id,
            p.name AS product_name,
            p.status,
            p.description AS product_description,
            ps.offer_price,
            ps.price,
            ps.size,
            ps.unit_length,
            ps.weight,
            ps.diameter,
            ps.thickness,
            ps.length,
            ps.length_unit,
            ps.width,
            ps.width_unit,
            ps.height,
            ps.height_unit,
            ps.size_unit,
            GROUP_CONCAT(DISTINCT category.name) AS category_names
        FROM 
            product_size ps
        INNER JOIN 
            product p ON ps.product_id = p.id
        INNER JOIN 
            product_category pc ON p.id = pc.product_id
        INNER JOIN 
            category ON pc.category_id = category.id
        WHERE 
            p.added_by IS NOT NULL
            AND p.status != 'removed'
        `;

        if (search) {
            sql += ` AND (LOWER(p.name) LIKE LOWER(:search) OR LOWER(p.description) LIKE LOWER(:search))`;
        }
        if (categoryId) {
            sql += ` AND pc.category_id = :categoryId`;
        }

        sql += `
            GROUP BY ps.id
            LIMIT :limit OFFSET :offset
        `;

        let countSql = `
            SELECT COUNT(DISTINCT ps.id) AS total_count
            FROM product_size ps
            INNER JOIN product p ON ps.product_id = p.id
            LEFT JOIN product_category pc ON p.id = pc.product_id
            LEFT JOIN category ON pc.category_id = category.id
            WHERE p.added_by IS NOT NULL
            AND p.status != 'removed'
        `;

        if (search) {
            countSql += ` AND (LOWER(p.name) LIKE LOWER(:search) OR LOWER(p.description) LIKE LOWER(:search))`;
        }

        if (categoryId) {
            countSql += ` AND pc.category_id = :categoryId`;
        }

        const totalCountResult = await sequelize.query(countSql, {
            type: sequelize.QueryTypes.SELECT,
            replacements: {
                search: `%${search}%`,
                categoryId: categoryId
            }
        });

        const totalCount = totalCountResult[0].total_count;

        const productsWithPrices = await sequelize.query(sql, {
            type: sequelize.QueryTypes.SELECT,
            replacements: {
                limit: limit,
                offset: offset,
                search: `%${search}%`,
                categoryId: categoryId
            }
        });

        res.status(200).json({
            total_count: totalCount,
            products: productsWithPrices
        });
    } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({ error: "Failed to fetch products" });
    }
};


exports.listCategories = async (req, res, next) => {
    try {
        let sql = `
            SELECT c.id, c.name, c.added_by 
            FROM category c
            WHERE c.status != 'removed'
            AND c.added_by IS NOT NULL
        `;

        const categories = await sequelize.query(sql, {
            type: sequelize.QueryTypes.SELECT,
        });

        res.status(200).json({
            categories: categories
        });
    } catch (error) {
        console.error("Error fetching categories:", error);
        res.status(500).json({ error: "Failed to fetch categories" });
    }
};

exports.updatePrice = async (req, res, next) => {
    try {
        console.log(req.body, 'body req');
        const id = req.body.id;
        const newPrice = req.body.newPrice;
        const type = req.body.type;

        if (!id || newPrice === undefined || type === undefined) {
            return res.status(400).json({ error: "id, price type, and updated price are required" });
        }

        let sql;
        let result;
        let replacementKey;

        if (type === 'price') {
            sql = `
                UPDATE product_size
                SET price = :newPrice
                WHERE id = :id
            `;
            replacementKey = 'newPrice';
        } else if (type === 'offer_price') {
            sql = `
                UPDATE product_size
                SET offer_price = :newPrice
                WHERE id = :id
            `;
            replacementKey = 'newPrice';
        } else {
            return res.status(400).json({ error: "Invalid type provided" });
        }

        result = await sequelize.query(sql, {
            type: sequelize.QueryTypes.UPDATE,
            replacements: {
                id: id,
                [replacementKey]: newPrice
            }
        });
        console.log(result, 'result');
        if (result[1] === 0) {
            return res.status(404).json({ error: "Price update failed or the new price is the same as the old one", status: 404 });
        }

        res.status(200).json({ message: "Product rate updated successfully", status: 200 });
    } catch (error) {
        console.error("Error updating price:", error);
        res.status(500).json({ error: "Failed to update price" });
    }
};
