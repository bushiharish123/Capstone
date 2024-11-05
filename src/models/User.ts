import mongoose, { Document, Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

// Define the User interface
interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  age: number;
  height: number;
  gender: string;
  futureGoals?: string;
  achievements?: string;
  school?: string;
  sports: string[];
  isAthlet: boolean;
  avgRating?:number;
  totalRaters?:number;
  profilePic?: string; // Optional profile picture path
  dob?:string;
  location?:string;
  certificate?:string;
  stats?:string;
  certificateName?:string;
  yoe?:number;
  position?:string;
  otp?:number;
  otpExpiry?:Date;
  matchPassword(password: string): Promise<boolean>;
}

// Define the User schema
const UserSchema: Schema<IUser> = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  age: { type: Number, required: true },
  height: { type: Number, required: true },
  gender: { type: String, required: true },
  futureGoals: { type: String, required: false },
  achievements: { type: String, required: false },
  sports: { type: [String], required: true },
  school: { type: String, required: false },
  isAthlet: { type: Boolean, default: false },
  avgRating:{ type: String, required: false },
  totalRaters:{ type: String, required: false },
  profilePic: { type: String, required: false }, // Profile picture field
  dob:{type:String,required:false},
  location:{type:String,required:false},
  certificate:{type:String,required:false},
  certificateName:{type:String,required:false},
  stats:{type:String,required:false},
  yoe:{type:Number,required:false},
  position:{type:String,required:false},
  otp:{type:Number,required:false},
  otpExpiry:{type: Date, default: Date.now},
});

// Pre-save middleware to hash the password before saving
UserSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err: any) {
    next(err);
  }
});

// Method to compare entered password with hashed password in the database
UserSchema.methods.matchPassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.password);
};

// Create and export the User model
const User: Model<IUser> = mongoose.model<IUser>('User', UserSchema);

export default User;
