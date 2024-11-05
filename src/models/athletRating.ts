import mongoose, { Date, Document, Schema } from 'mongoose';

interface IRatingAthlet extends Document {
    agentId: string;   // The ID of the user who gives the rating
    userId : string;  // The ID of the agent who receives the rating
    rating: number;   // The rating value, typically between 1 and 5
    feedback?: string; // Optional feedback or comments about the agent
    createdAt: Date;  // Timestamp of when the rating was created
    firstname:string;
    lastname:string;
}

const AthletRatingSchema: Schema = new Schema({
    agentId : { type: String, ref: 'UserAsAgent', required: true }, // Corrected to ObjectId
    userId: { type: String, ref: 'User', required: true }, // Corrected to ObjectId
  rating: { type: Number, required: true, min: 1, max: 5 },
  feedback: { type: String, required: false },
  createdAt: { type: Date, default: Date.now },
  firstname:{type:String,required:false},
  lastname:{type:String,required:false}
  });
  

const AthletRating = mongoose.model<IRatingAthlet>('AthletRating', AthletRatingSchema);

export default AthletRating;
