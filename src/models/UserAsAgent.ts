import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

interface IuserAsAgent extends Document {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    professionalBackground:string;
    descriptions:string;
    specialization:string[];
    avgRating?:number;
    totalRaters?:number;
    profilePic?: string;
    isAthlet?: boolean;
    dob?:string;
    location?:string;
    certificate?:string;
    stats?:string;
    certificateName?:string;
    yoe?:number;
    position?:string;
    otp?:number;
    otpExpiry?:Date;
    listOfSubscribers?:string[];
  matchPassword(password: string): Promise<boolean>;
}

const UserAsAgentSchema: Schema = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  professionalBackground:{ type: String, required: false },
  descriptions:{ type: String, required: false },
  specialization:{type: [String], required: false},
  avgRating:{ type: String, required: false },
  totalRaters:{ type: String, required: false },
  isAthlet: { type: Boolean, default: false },
  profilePic: { type: String, required: false },
  dob:{type:String,required:false},
  location:{type:String,required:false},
  certificate:{type:String,required:false},
  certificateName:{type:String,required:false},
  stats:{type:String,required:false},
  yoe:{type:Number,required:false},
  position:{type:String,required:false},
  otp:{type:Number,required:false},
  otpExpiry:{type: Date, default: Date.now},
  listOfSubscribers:{type:[String],require:false},
});

UserAsAgentSchema.pre<IuserAsAgent>('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err:any) {
    next(err);
  }
});

UserAsAgentSchema.methods.matchPassword = async function (password: string): Promise<boolean> {
  return await bcrypt.compare(password, this.password);
};

const UserAsAgent = mongoose.model<IuserAsAgent>('UserAsAgent', UserAsAgentSchema);

export default UserAsAgent;
