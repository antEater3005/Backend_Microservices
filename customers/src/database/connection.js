const mongoose = require('mongoose');
const { DB_URL } = require('../config');

module.exports = async () => {
  try {
    await mongoose.connect(DB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('DataBase Connected');
  } catch (error) {
    console.log('Error ============  ', DB_URL);
    console.log(error);
    process.exit(1);
  }
};
