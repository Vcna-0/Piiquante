const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const modelUserSchema = mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

modelUserSchema.plugin(uniqueValidator);

module.exports = mongoose.model('User', modelUserSchema);