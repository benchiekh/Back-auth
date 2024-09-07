const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true }, // Utilisez 'email' à la place de 'username'
    password: { type: String, required: true },
    role: { type: String, required: true, default: 'user' } // Assurez-vous que 'role' est défini
});

const User = mongoose.model('User', userSchema);

module.exports = User;
