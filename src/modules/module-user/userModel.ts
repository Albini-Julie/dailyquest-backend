import { Schema, model, Document } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  points: number;
  isAdmin: boolean;
  comparePassword(password: string): Promise<boolean>;
  createdAt: Date;
  updatedAt: Date;
  successfulQuests: number;
  failedQuests: number;
  dailyValidations: number;
  lastValidationDate?: Date;
}

const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: [true, 'Le nom d’utilisateur est requis'],
      unique: true,
      trim: true,
      minlength: [3, 'Le nom d’utilisateur doit contenir au moins 3 caractères'],
    },
    email: {
      type: String,
      required: [true, 'L’email est requis'],
      unique: true,
      match: [/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, 'Adresse e-mail invalide'],
    },
    password: {
      type: String,
      required: [true, 'Le mot de passe est requis'],
      minlength: [8, 'Le mot de passe doit contenir au moins 8 caractères'],
      validate: {
        validator: (value: string) =>
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(value),
        message:
          'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial',
      },
    },
    points: { type: Number, default: 0 },
    isAdmin: { type: Boolean, default: false },
    successfulQuests: { type: Number, default: 0 },
    failedQuests: { type: Number, default: 0 },
    dailyValidations: { type: Number, default: 0 },
    lastValidationDate: { type: Date },
  },
  { timestamps: true }
);

// Hash du mot de passe avant enregistrement
userSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Méthode pour comparer les mots de passe
userSchema.methods.comparePassword = async function (password: string) {
  return await bcrypt.compare(password, this.password);
};

export const UserModel = model<IUser>('User', userSchema);
