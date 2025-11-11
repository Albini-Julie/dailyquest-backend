const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema(
  {
    username: { 
      type: String, 
      required: [true, 'Le nom d’utilisateur est requis'], 
      unique: true, 
      trim: true,
      minlength: [3, 'Le nom d’utilisateur doit contenir au moins 3 caractères']
    },
    email: { 
      type: String, 
      required: [true, 'L’email est requis'], 
      unique: true, 
      match: [
        /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
        'Adresse e-mail invalide'
      ]
    },
    password: { 
      type: String, 
      required: [true, 'Le mot de passe est requis'],
      minlength: [8, 'Le mot de passe doit contenir au moins 8 caractères'],
      validate: {
        validator: function (value) {
          // Regex pour : 1 majuscule, 1 minuscule, 1 chiffre, 1 caractère spécial
          return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(value);
        },
        message:
          'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial',
      },
    },
    points: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Hash du mot de passe avant enregistrement
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
