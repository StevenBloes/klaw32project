const mysql = require("mysql2/promise");

// ✅ Your normalization function
function normalizeProductionCodes(input) {
    if (!input) return [];

    const parts = input.match(/\d+/g);
    if (!parts || parts.length === 0) return [];

    const base = parts[0];
    const result = [base];

    for (let i = 1; i < parts.length; i++) {
        let part = parts[i];

        if (part.length < base.length) {
            const prefix = base.slice(0, base.length - part.length);
            part = prefix + part;
        }

        result.push(part);
    }

    return result;
}

async function migrateProductionCodes() {
    const connection = await mysql.createConnection({
        host: "192.168.28.132",
        user: "admin",
        password: "admin",
        database: "kla_w32_processes"
    });

    try {
        console.log("✅ Connected to database");

        // Start transaction
        await connection.beginTransaction();

        // OPTIONAL: clear mapping table first
        await connection.query("DELETE FROM ordered_product_production");
        console.log("🧹 Cleared mapping table");

        // Fetch all existing rows
        const [rows] = await connection.query(`
            SELECT id_ordered_product, production_code
            FROM ordered_products
            WHERE production_code IS NOT NULL
        `);

        console.log(`📥 Found ${rows.length} rows to process`);

        let insertCount = 0;

        for (const row of rows) {
            const { id_ordered_product, production_code } = row;

            const codes = normalizeProductionCodes(production_code);

            if (codes.length === 0) continue;

            for (const code of codes) {
                await connection.query(
                    `
                    INSERT INTO ordered_product_production 
                    (ordered_product_id, production_id)
                    VALUES (?, ?)
                    `,
                    [id_ordered_product, code]
                );

                insertCount++;
            }
        }

        // Commit transaction
        await connection.commit();

        console.log(`✅ Migration completed`);
        console.log(`📊 Inserted ${insertCount} relations`);

    } catch (error) {
        console.error("❌ Error occurred:", error);

        // Rollback on error
        await connection.rollback();
    } finally {
        await connection.end();
        console.log("🔌 Connection closed");
    }
}

// Run script
migrateProductionCodes();
