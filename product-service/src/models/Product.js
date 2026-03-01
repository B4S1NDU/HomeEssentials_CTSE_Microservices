const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    minlength: [3, 'Product name must be at least 3 characters'],
    maxlength: [100, 'Product name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    trim: true,
    minlength: [10, 'Description must be at least 10 characters'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  category: {
    type: String,
    required: [true, 'Product category is required'],
    enum: {
      values: ['rice', 'soap', 'detergent', 'cooking-oil', 'spices', 'cleaning', 'personal-care', 'other'],
      message: '{VALUE} is not a valid category'
    }
  },
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price cannot be negative']
  },
  unit: {
    type: String,
    required: [true, 'Product unit is required'],
    enum: ['kg', 'g', 'l', 'ml', 'piece', 'pack']
  },
  imageUrl: {
    type: String,
    default: 'https://via.placeholder.com/300x300?text=Product+Image'
  },
  brand: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: String,
    default: 'admin'
  }
}, {
  timestamps: true
});

// Indexes for better query performance
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ name: 'text', description: 'text' });

// Virtual for formatted price
productSchema.virtual('formattedPrice').get(function() {
  return `LKR ${this.price.toFixed(2)}`;
});

// Ensure virtuals are included in JSON
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
