const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const studentSchema = new Schema({
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  age: { 
    type: Number, 
    required: true,
    min: 1,
    max: 100
  },
  class: { 
    type: String, 
    required: true,
    trim: true
  }
}, { 
  collection: 'students',
  timestamps: true
});

module.exports = mongoose.model('Student', studentSchema);