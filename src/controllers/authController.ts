import { Request, Response } from 'express';
import { registerUser, loginUser, sportsList, searchByNames, registerUserAsAgent, agentSearches, getRecommendedUsers, getRecommendedForAgents, ratingForAgents, ratingForAthlets, getAthletRating, getAgentRating, events, getEventsOfUsers, getProfiles, getAgentProfiles, delEvents, reScheduleEvents, validateOtp, subscribeUsers } from '../services/authService';
import { blacklist } from '../middleware/authMiddleware';
import ProfilePicture from '../models/ProfilePicture';
import { subscribe } from 'diagnostics_channel';
import User from '../models/User';
export const register = async (req: Request, res: Response) => {
  try {
    // Retrieve uploaded files
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    
    // Generate the URLs for profilePic and certificate if files are uploaded
    const profilePicUrl = files?.profilePic ? `${req.protocol}://${req.get('host')}/uploads/${files.profilePic[0].filename}` : undefined;
    const certificateUrl = files?.certificate ? `${req.protocol}://${req.get('host')}/uploads/${files.certificate[0].filename}` : undefined;

    // Merge the URLs with req.body
    const userData = {
      ...req.body,
      profilePic: profilePicUrl, // Add the profilePic URL to userData
      certificate: certificateUrl, // Add the certificate URL to userData
    };

    // Register as an athlete or agent depending on `isAthlet`
    const user = req.body.isAthlet === "true"
      ? await registerUser(userData)
      : await registerUserAsAgent(userData);

    res.status(201).json({ message: 'User registered successfully', user });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};



export const login = async (req: Request, res: Response) => {
  try {
    const resp = await loginUser(req.body.email, req.body.password,req.body.isAthlet);
    res.json( resp );
  } catch (error:any) {
    res.status(400).json({ error: error.message });
  }
};
export const validateOTP = async (req:any, res:any) => {
  try {
    const { email, otp,isAthlet } = req.body;
    const response = await validateOtp(email, otp,isAthlet);
    res.json(response);
  } catch (err:any) {
    res.status(400).json({ error: err.message });
  }
};
export const getSports= async(req:Request,res:Response)=>{
  try {
    console.log("getting the sports list");
    const list = await sportsList(req,res);
    console.log("getting the sports list",list);
    res.json(list);
  } catch (error:any) {
    res.status(400).json({ error: error.message });
  }
}

export const searchByName = async(req:Request,res:Response)=>{
  try{
    const details = await searchByNames(req);
    res.json(details);
  }catch (error:any) {
    res.status(400).json({ error: error.message });
  }
}
export const searchByNameForAgent = async(req:Request,res:Response)=>{
  try{
    const details = await agentSearches(req);
    res.json(details);
  }catch (error:any) {
    res.status(400).json({ error: error.message });
  }
}
export const getAthletRatings = async(req:Request,res:Response)=>{
  try{
    const details = await getAthletRating(req,res);
    res.json(details);
  }catch (error:any) {
    res.status(400).json({ error: error.message });
  }
}
export const getAgentRatings = async(req:Request,res:Response)=>{
  try{
    const details = await getAgentRating(req,res);
    res.json(details);
  }catch (error:any) {
    res.status(400).json({ error: error.message });
  }
}
export const getRecommendedUser = async(req:Request,res:Response)=>{
  try {
    const users = await getRecommendedUsers(req);
    res.json(users);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}
export const getRecommendedForAgent = async(req:Request,res:Response)=>{
  try {
    const users = await getRecommendedForAgents(req);
    res.json(users);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}
export const ratingForAgent = async (req: Request, res: Response) => {
  try {
    const rate = await ratingForAgents(req.body);
    res.status(200).json({ message: 'Rated Successfully', rate });
  } catch (error:any) {
    res.status(400).json({ error: error.message });
  }
};
export const ratingForAthlet = async (req: Request, res: Response) => {
  try {
    const rate = await ratingForAthlets(req.body);
    res.status(200).json({ message: 'Rated Successfully', rate });
  } catch (error:any) {
    res.status(400).json({ error: error.message });
  }
};
export const setEvent = async (req: Request, res: Response) => {
  try {
    const rate = await events(req.body);
    res.status(200).json({ message: 'Event Created Successfully', rate });
  } catch (error:any) {
    res.status(400).json({ error: error.message });
  }
};
export const subscribeUser = async(req:any,res:any)=>{
try{
  const statusOfActivity = await subscribeUsers(req);
  res.status(200).json({message:'subscribed Successfully',user:statusOfActivity});
  
}catch(error:any){
res.status(400).json({error:error.message})
}
}

export const delEvent =async (req:Request,res:Response)=>{
  try{
const delResponse = await delEvents(req);
// console.log(delResponse);
res.status(200).json({message:'Event Cancelled Successfully'})
  }
  catch(error:any){
    res.status(400).json({error:error.message});
  }
};
export const rescheduleEvent = async (req: Request, res: Response) => {
  try {
    const rate = await reScheduleEvents(req);
    res.status(200).json(rate);
  } catch (error:any) {
    res.status(400).json({ error: error.message });
  }
};
export const getUserEvents = async(req:Request,res:Response)=>{
  try {
    const users = await getEventsOfUsers(req);
    res.json(users);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}
export const getProfile = async(req:Request,res:Response)=>{
  try {
    const users = await getProfiles(req);
    res.json(users);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}
export const getAgentProfile = async(req:Request,res:Response)=>{
  try {
    const users = await getAgentProfiles(req);
    res.json(users);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}
export const logout = (req: Request, res: Response) => {
  const token = req.header('Authorization')?.split(' ')[1];

  if (!token) {
    return res.status(400).json({ message: 'No token provided' });
  }

  // Add the token to the blacklist
  blacklist.add(token);

  res.status(200).json({ message: 'User logged out successfully' });
};
export const uploadProfilePicture = async (req: Request, res: Response) => {
  try {
    if (!req.body.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { email } = req.body; // Get the email from the request body
    const filePath = req.body.file.path; // Get the file path from the uploaded file

    // Find if an existing profile picture entry is present for the user
    const existingProfilePic = await ProfilePicture.findOne({ email });

    if (existingProfilePic) {
      // Update the existing entry
      existingProfilePic.imagePath = filePath;
      existingProfilePic.uploadedAt = new Date();
      await existingProfilePic.save();
    } else {
      // Create a new profile picture entry
      const newProfilePicture = new ProfilePicture({ email, imagePath: filePath });
      await newProfilePicture.save();
    }

    res.json({ message: 'Profile picture uploaded successfully', profilePicture: filePath });
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    res.status(500).json({ message: 'Error uploading profile picture', error });
  }
};
