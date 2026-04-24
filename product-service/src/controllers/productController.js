const Product = require('../models/Product');
const { validationResult } = require('express-validator');

// @desc    Get all products
// @route   GET /api/products
// @access  Public
exports.getAllProducts = async (req, res, next) => {
  try {
    const { category, isActive, search, page = 1, limit = 10 } = req.query;

    // Build filter
    const filter = {};
    if (category) filter.category = category;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) {
      filter.$text = { $search: search };
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute Query
    const products = await Product.find(filter)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Product.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      data: products
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Public
exports.getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Product not found with id: ${req.params.id}`
      });
    }

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format'
      });
    }
    next(error);
  }
};

// @desc    Create new product
// @route   POST /api/products
// @access  Private (Admin)
exports.createProduct = async (req, res, next) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const product = await Product.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Product with this name already exists'
      });
    }
    next(error);
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private (Admin)
exports.updateProduct = async (req, res, next) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Product not found with id: ${req.params.id}`
      });
    }

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format'
      });
    }
    next(error);
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private (Admin)
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Product not found with id: ${req.params.id}`
      });
    }

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
      data: {}
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format'
      });
    }
    next(error);
  }
};

// @desc    Get products by category
// @route   GET /api/products/category/:category
// @access  Public
exports.getProductsByCategory = async (req, res, next) => {
  try {
    const { category } = req.params;
    const products = await Product.find({ 
      category, 
      isActive: true 
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: products.length,
      category,
      data: products
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get product categories
// @route   GET /api/products/categories/list
// @access  Public
exports.getCategories = async (req, res, next) => {
  try {
    const categories = [
      { value: 'rice', label: 'Rice' },
      { value: 'soap', label: 'Soap' },
      { value: 'detergent', label: 'Detergent' },
      { value: 'cooking-oil', label: 'Cooking Oil' },
      { value: 'spices', label: 'Spices' },
      { value: 'cleaning', label: 'Cleaning Supplies' },
      { value: 'personal-care', label: 'Personal Care' },
      { value: 'other', label: 'Other' }
    ];

    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    next(error);
  }
};
