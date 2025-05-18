const express = require('express');
const router = express.Router();
const Todo = require('../models/Todo');

// Get all todos
router.get('/', async (req, res) => {
    try {
        const filter = {};

        if (req.query.category && req.query.category !== 'all') {
            filter.category = req.query.category;
        }

        if (req.query.priority && req.query.priority !== 'all') {
            filter.priority = req.query.priority;
        }

        const todos = await Todo.find(filter).sort({ createdAt: -1 });
        res.json(todos);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/categories', async (req, res) => {
    try {
        const categories = await Todo.distinct('category');
        res.json(categories);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Добавьте этот новый маршрут
router.patch('/update-category', async (req, res) => {
    try {
        const { oldCategory, newCategory } = req.body;

        const result = await Todo.updateMany(
            { category: oldCategory },
            { $set: { category: newCategory } }
        );

        res.json({ updatedCount: result.nModified });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create new todo
router.post('/', async (req, res) => {
    const todo = new Todo({
        title: req.body.title,
        description: req.body.description,
        category: req.body.category || 'general',
        priority: req.body.priority || 'medium',
        dueDate: req.body.dueDate
    });

    try {
        const newTodo = await todo.save();
        res.status(201).json(newTodo);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update todo
router.patch('/:id', async (req, res) => {
    try {
        const todo = await Todo.findById(req.params.id);
        if (!todo) return res.status(404).json({ message: 'Todo not found' });

        if (req.body.title) todo.title = req.body.title;
        if (req.body.description !== undefined) todo.description = req.body.description;
        if (req.body.category) todo.category = req.body.category;
        if (req.body.priority) todo.priority = req.body.priority;
        if (req.body.dueDate !== undefined) todo.dueDate = req.body.dueDate;
        if (req.body.completed !== undefined) todo.completed = req.body.completed;

        const updatedTodo = await todo.save();
        res.json(updatedTodo);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete todo
router.delete('/:id', async (req, res) => {
    try {
        const todo = await Todo.findByIdAndDelete(req.params.id);
        if (!todo) return res.status(404).json({ message: 'Todo not found' });
        res.json({ message: 'Todo deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;