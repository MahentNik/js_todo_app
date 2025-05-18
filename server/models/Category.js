const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    color: {
        type: String,
        default: '#5cb85c'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Предварительная обработка для сохранения имени в нижнем регистре
categorySchema.pre('save', function(next) {
    this.name = this.name.toLowerCase();
    next();
});

module.exports = mongoose.model('Category', categorySchema);