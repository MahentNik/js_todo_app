const express = require('express');
const router = express.Router();
const Category = require('../models/Category');

// Create new category
router.post('/', async (req, res) => {
    try {
        const category = new Category({
            name: req.body.name,
            color: req.body.color || '#5cb85c'
        });

        const newCategory = await category.save();
        res.status(201).json(newCategory);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Get all categories
router.get('/', async (req, res) => {
    try {
        const categories = await Category.find().sort({ name: 1 });
        res.json(categories);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update category
router.patch('/:id', async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) return res.status(404).json({ message: 'Category not found' });

        if (req.body.name) category.name = req.body.name;
        if (req.body.color) category.color = req.body.color;

        const updatedCategory = await category.save();
        res.json(updatedCategory);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete category
router.delete('/:id', async (req, res) => {
    try {
        const category = await Category.findByIdAndDelete(req.params.id);
        if (!category) return res.status(404).json({ message: 'Category not found' });

        // Move all todos from this category to general
        const generalCategory = await Category.findOne({ name: 'general' });
        if (generalCategory) {
            await Todo.updateMany(
                { category: category._id },
                { $set: { category: generalCategory._id } }
            );
        }

        res.json({ message: 'Category deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;