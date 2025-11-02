const { sequelize } = require('./config/database');

async function checkTableStructure() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');
    
    // Get table structure
    const [results] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position;
    `);
    
    console.log('\n📋 Users table structure:');
    console.table(results);
    
    await sequelize.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkTableStructure();