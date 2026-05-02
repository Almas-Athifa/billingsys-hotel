const Category = require('../models/Category');

const getCategories = async (req, res) => {
  const categories = await Category.find({});
  res.json(categories);
};

const createCategory = async (req, res) => {
  try {
     const category = new Category({
       name: req.body.name
     });
     const createdCategory = await category.save();
     res.status(201).json(createdCategory);
  } catch(error) {
     res.status(400).json({ message: 'Category already exists or invalid data' });
  }
};

const updateCategory = async (req, res) => {
  const category = await Category.findById(req.params.id);

  if (category) {
    category.name = req.body.name || category.name;
    const updatedCategory = await category.save();
    res.json(updatedCategory);
  } else {
    res.status(404).json({ message: 'Category not found' });
  }
};

const deleteCategory = async (req, res) => {
  const category = await Category.findById(req.params.id);

  if (category) {
    await Category.deleteOne({ _id: req.params.id });
    res.json({ message: 'Category removed' });
  } else {
    res.status(404).json({ message: 'Category not found' });
  }
};

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };
