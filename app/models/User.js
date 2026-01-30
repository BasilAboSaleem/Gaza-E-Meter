// app/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const USER_ROLES = ['SUPER_ADMIN' ,'COMPANY_ADMIN', 'COLLECTOR', 'ACCOUNTANT', 'SUBSCRIBER'];

const userSchema = new mongoose.Schema(
  {
    company: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Company",
  default: null, // null = سوبر أدمن 
},
subscriber: {
  type: mongoose.Schema.Types.ObjectId, 
  ref: 'Subscriber',
  default: null
},
    fullName: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 100
    },

    email: {
      type: String, unique: true, sparse: true,
      lowercase: true,
      trim: true,
      
    },

    phone: {
    type: String, unique: true, sparse: true
    },

    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false
    },

    role: {
      type: String,
      enum: USER_ROLES,
      default: 'COLLECTOR'
    },

    isActive: {
      type: Boolean,
      default: true
    },

    lastLoginAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});
userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);