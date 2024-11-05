// services/authService.ts
import { Request, Response } from 'express';
import User from '../models/User';
import UserAsAgent from '../models/UserAsAgent';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import Sport from '../models/Soprts';
import AgentRating from '../models/AgentRating';
import AthletRating from '../models/athletRating';
import EventCreate from '../models/event';
import mongoose, { Types } from 'mongoose';
// import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { google, calendar_v3 } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { OAuth2Client } from 'google-auth-library';

dotenv.config();

interface RegisterUser {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  age: number;
  height:number;
  gender:string;
  sports: string[];
  futureGoals?:string;
  achievements?:string;
  isAthlet?: boolean;
  profilePic?: any;
}
interface registerUserAsAgent {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  professionalBackground:string;
  descriptions:string;
  specialization:string
  isAthlet?: boolean;
  profilePic?: any;
}
interface agentRating {
  userId: string;   
    agentId: string;  
    rating: number;   
    feedback?: string; 
    createdAt: Date;  
}
interface athletRating {
  agentId : string;   
  userId: string;  
    rating: number;   
    feedback?: string; 
    createdAt: Date;  
}
interface Events {
  schedulerUser : string;   
  receiverUser: string;   
  eventDate: Date;
  title ?:string;
}

export const registerUser = async (userData: RegisterUser) => {
  // Check if a user already exists with the same firstName and lastName (case-insensitive)
  console.log("In the register user")
  const existingUser = await User.findOne({
    email: { $regex: new RegExp(`^${userData.email}$`, "i") }
  });

  if (existingUser) {
    throw new Error("User with the same email already exists.");
  }

  const user = new User(userData);
  return await user.save();
};
export const registerUserAsAgent = async(userData: registerUserAsAgent)=>{
  console.log("In the register Agent")

  const existingUser = await UserAsAgent.findOne({
    email: { $regex: new RegExp(`^${userData.email}$`, "i") }
  });

  if (existingUser) {
    throw new Error("User as agent with the same email already exists.");
  }

  const user = new UserAsAgent(userData);
  return await user.save();
}


export const loginUser = async (email: string, password: string, isAthlet: boolean) => {
  const user = isAthlet ? await User.findOne({ email }) : await UserAsAgent.findOne({ email });
  if (!user) throw new Error('Invalid credentials');

  const isMatch = await user.matchPassword(password);
  if (!isMatch) throw new Error('Invalid credentials');

  // Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000); // Generates a 6-digit OTP

  // Store the OTP in the user record or another database temporarily
  user.otp = otp;
  user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);; // OTP expires in 10 minutes
  await user.save();

  // Send OTP via email
  const transporter = nodemailer.createTransport({
    service: 'gmail', // or any other email service
    auth: {
      user: process.env.EMAIL_USER, // your email
      pass: process.env.EMAIL_PASS, // your email password
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: user.email,
    subject: 'Your OTP Code',
    text: `Your OTP code is ${otp}`,
  };

  await transporter.sendMail(mailOptions);

  return { message: 'OTP sent to your email' };
};

export const validateOtp = async (email: string, otp: number,isAthlet:boolean) => {
  const user = isAthlet?await User.findOne({ email }):await UserAsAgent.findOne({ email });
  if (!user) throw new Error('Invalid email');

  if (user.otp !== otp) throw new Error('Invalid OTP');
  // if (user.otpExpiry < Date.now()) throw new Error('OTP has expired');
  if (!user.otpExpiry || user.otpExpiry.getTime() < Date.now()) {
    throw new Error('OTP has expired');
  }
  // Clear the OTP and expiry after validation
  user.otp = undefined;
  user.otpExpiry = undefined;
  await user.save();

  // Generate JWT token
  const token = jwt.sign(
    { id: user._id, isAthlet: user.isAthlet },
    process.env.JWT_SECRET!,
    { expiresIn: '1h' }
  );

  return { token, userDetails: user };
};

export const sportsList = async (req: any, res: any) => {
  try {
    const sportsList = await Sport.find(); // Query to get all sports documents
    console.log('List Of Sports', JSON.stringify(sportsList));
    res.json(sportsList); // Send the sports list as JSON
  } catch (error) {
    throw new Error("User with the same email already exists.");
    }
};

export const searchByNames = async (req: any) => {
  let users; // To handle multiple results

  const searchTerm = req.query.searchTerm; // The search term from query parameters

  // If no search term is provided, return an empty response or error
  if (!searchTerm) {
    throw new Error('Please provide a search term.');
  }

  // Use the $or operator to search in firstName, lastName, and email fields
  const query = {
    $or: [
      { firstName: { $regex: searchTerm, $options: 'i' } }, // Case-insensitive search in firstName
      { lastName: { $regex: searchTerm, $options: 'i' } },  // Case-insensitive search in lastName
      { email: { $regex: searchTerm, $options: 'i' } },
      { sports: { $regex: searchTerm, $options: 'i' } }      // Case-insensitive search in email
    ]
  };

  // Fetch the users based on the dynamic query
  users = await User.find(query);

  if (!users || users.length === 0) {
    throw new Error('No users found'); // Return error if no user matches
  }

  console.log(users);
  return users; // Return the list of users
};
export const agentSearches = async (req: any) => {
  let users; // To handle multiple results

  const searchTerm = req.query.searchTerm; // The search term from query parameters

  // If no search term is provided, return an empty response or error
  if (!searchTerm) {
    throw new Error('Please provide a search term.');
  }

  // Use the $or operator to search in firstName, lastName, and email fields
  const query = {
    $or: [
      { firstName: { $regex: searchTerm, $options: 'i' } }, // Case-insensitive search in firstName
      { lastName: { $regex: searchTerm, $options: 'i' } },  // Case-insensitive search in lastName
      { email: { $regex: searchTerm, $options: 'i' } },
      { specialization: { $regex: searchTerm, $options: 'i' } }      // Case-insensitive search in email
    ]
  };

  // Fetch the users based on the dynamic query
  users = await UserAsAgent.find(query);

  if (!users || users.length === 0) {
    throw new Error('No users found'); // Return error if no user matches
  }

  console.log(users);
  return users; // Return the list of users
};

// Function to get recommended users based on matching sports
export const getRecommendedUsers = async (req: any) => {
  // Extract email from query parameters
  const { email } = req.query;

  if (!email) {
    throw new Error('Email parameter is required.');
  }

  // Find the user by email
  const user = await User.findOne({ email });

  if (!user) {
    throw new Error('User not found.');
  }

  const sportsList = user.sports; // Get the sports list from the found user

  if (!sportsList || sportsList.length === 0) {
    throw new Error('User has no sports associated.');
  }

  // Create a query to find users whose sports match any of the provided sports
  const query = {
    specialization: { $in: sportsList }, // Use MongoDB's $in operator to match any sport in the sports array
  };

  // Fetch users who match the query
  const users = await UserAsAgent.find(query);

  if (!users || users.length === 0) {
    return [];
  }

  return users; // Return the list of users
};
export const getRecommendedForAgents = async (req: any) => {
  // Extract email from query parameters
  const { email } = req.query;

  if (!email) {
    throw new Error('Email parameter is required.');
  }

  // Find the user by email
  const user = await UserAsAgent.findOne({ email });

  if (!user) {
    throw new Error('User not found.');
  }

  const sportsList = user.specialization; // Get the sports list from the found user

  if (!sportsList || sportsList.length === 0) {
    throw new Error('User has no sports associated.');
  }

  // Create a query to find users whose sports match any of the provided sports
  const query = {
    sports: { $in: sportsList }, // Use MongoDB's $in operator to match any sport in the sports array
  };

  // Fetch users who match the query
  const users = await User.find(query);

  if (!users || users.length === 0) {
   return [];
  }

  return users; // Return the list of users
};
export const ratingForAgents=async (rating:agentRating) => {
  const existingRating = await AgentRating.findOne({
    userId: rating.userId,
    agentId: rating.agentId
  });
  if (existingRating) {
    throw new Error('User has already rated this agent.');
  }
  const rate = new AgentRating(rating);
  await rate.save();
  return ;

};
export const ratingForAthlets=async (rating:athletRating) => {
  const existingRating = await AthletRating.findOne({
    userId: rating.userId,
    agentId: rating.agentId
  });
  if (existingRating) {
    throw new Error('User has already rated this Athlet.');
  }
  const rate = new AthletRating(rating);
  await rate.save();
  return ;

};

// export const events=async (rating:Events) => {
//   const event = new EventCreate(rating);
//   await event.save();
//   const transporter = nodemailer.createTransport({
//     service: 'gmail', // or any other email service
//     auth: {
//       user: process.env.EMAIL_USER, // your email
//       pass: process.env.EMAIL_PASS, // your email password
//     },
//   });

//   const mailToSender = {
//     from: process.env.EMAIL_USER,
//     to: rating.schedulerUser,
//     subject: 'Schedule the Event',
//     text: `You have Scheduled the meet with the user having email Id ${rating.receiverUser}, having title ${rating.title}`,
//   };
//   const mailToReceiver = {
//     from: process.env.EMAIL_USER,
//     to: rating.receiverUser,
//     subject: 'Schedule the Event',
//     text: `The user having email Id ${rating.schedulerUser} has scheduled an Event with You, having title ${rating.title} `,
//   };

//   await transporter.sendMail(mailToSender);
//   await transporter.sendMail(mailToReceiver);
//   return ;
// };
export const subscribeUsers =async (req:any)=>{
  const {subscriberId,subscribeeId}=req.body;
  try{
    const updatedUser = await UserAsAgent.findOneAndUpdate(
      { _id: subscribeeId },
      { $addToSet: { listOfSubscribers: subscriberId } }, // Only add if not already present
      { new: true, runValidators: true } // Return the updated document with validation
    );
    return updatedUser;

  }catch(error:any){
    throw error;
  }
}
export const delEvents = async (req: any) => {
  const id = req.query.id;

  if (!id) {
    throw new Error('Id parameter is required.');
  }

  // Check if the id is a valid MongoDB ObjectId
  if (!Types.ObjectId.isValid(id)) {
    throw new Error('Invalid event ID format.');
  }

  try {
    // Find and delete the event by its _id
    const result = await EventCreate.findByIdAndDelete(id);
    if (result) {
      return 'Cancelled Successfully';
    } else {
      throw new Error('Event ID not found.');
    }
  } catch (error) {
    console.error('Error deleting event:', error);
    throw error; // Rethrow the error to be caught by the controller
  }
};
export const reScheduleEvents=async (req:any) => {
  // const event = new EventCreate(rating);
  // await event.save();
  
  const title = req.body.title;
  const id = req.body.id;
  const eventDate = req.body.eventDate;
  if (!Types.ObjectId.isValid(id)) {
    throw new Error('Invalid event ID format.');
  }

  try {
    // Find and delete the event by its _id
    const updatedUser = await EventCreate.findOneAndUpdate(
      { _id: id },
      { title: title, eventDate: eventDate },
      { new: true, runValidators: true } // Return the updated document
    );
  
    if (!updatedUser) {
      return { message: 'Event not found' };
    }else{
      return { message: 'Event Rescheduled Successfully' };
    }
  } catch (error) {
    console.error('Error rescheduling event:', error);
    throw error; // Rethrow the error to be caught by the controller
  }
  

};
export const getEventsOfUsers = async (req: any) => {
  // Extract email from query parameters
  const { email } = req.query;

  if (!email) {
    throw new Error('Email parameter is required.');
  }
  // const event = await EventCreate.find({
  //   $or: [{ schedulerUser: email }, { receiverUser: email }]
  // });
  const event = await EventCreate.find({
    $or: [{ schedulerUser: email }, { receiverUser: email }]
  }).sort({ eventDate: -1 });

  if (!event) {
    throw new Error('User not found.');
  }

  // Create a query to find users whose sports match any of the provided sports
  
  
  // Fetch users who match the query


  return event; // Return the list of users
};
export const getProfiles = async (req: any) => {
  // Extract email from query parameters
  const { email } = req.query;

  if (!email) {
    throw new Error('Email parameter is required.');
  }
  const userProfile = await User.findOne({ email });

  if (!userProfile) {
    throw new Error('User not found.');
  }

  // Create a query to find users whose sports match any of the provided sports
  
  
  // Fetch users who match the query


  return userProfile; // Return the list of users
};
export const getAgentProfiles = async (req: any) => {
  // Extract email from query parameters
  const { email } = req.query;

  if (!email) {
    throw new Error('Email parameter is required.');
  }
  const userProfile = await UserAsAgent.findOne({ email });

  if (!userProfile) {
    throw new Error('User not found.');
  }

  // Create a query to find users whose sports match any of the provided sports
  
  
  // Fetch users who match the query


  return userProfile; // Return the list of users
};

export const getAgentRating = async (req: Request, res: Response) => {
  try {
    const agentId = req.query.agentId as string;

    // Find all ratings for the given agent
    const ratings = await AgentRating.find({ agentId });

    if (!ratings || ratings.length === 0) {
      return { message: 'No ratings are there for the agent',ratings};
    }

    // Calculate the average rating using MongoDB aggregation
    const averageRatingResult = await AgentRating.aggregate([
      { $match: { agentId } }, // Filter by agentId
      {
        $group: {
          _id: '$agentId', // Group by agentId
          averageRating: { $avg: '$rating' }, // Calculate the average rating
          totalRaters: { $sum: 1 } // Count the total number of raters
        }
      }
    ]);

    // Extract the calculated average rating and total raters
    const { averageRating, totalRaters } = averageRatingResult[0] || { averageRating: 0, totalRaters: 0 };

    // Update the User model with the new average rating and total number of raters
    const updatedUser = await UserAsAgent.findOneAndUpdate(
      { _id: agentId },
      { avgRating: averageRating, totalRaters: totalRaters },
      { new: true, runValidators: true } // Return the updated document
    );

    if (!updatedUser) {
      return { message: 'User not found' };
    }

    // Return the ratings and updated average rating
    res.json({ 
      message: 'Ratings fetched and user updated successfully',
      ratings,
      averageRating,
      totalRaters 
    });

  } catch (error) {
    console.error('Error fetching and updating agent rating:', error);
    res.status(500).json({ message: 'Error fetching and updating agent rating', error });
  }
};

export const getAthletRating = async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;

    // Find all ratings for the given agent
    const ratings = await AthletRating.find({ userId });

    if (!ratings || ratings.length === 0) {
      return { message: 'No ratings are there for the Athlet', ratings };
    }

    // Calculate the average rating using MongoDB aggregation
    const averageRatingResult = await AthletRating.aggregate([
      { $match: { userId } }, // Filter by agentId
      {
        $group: {
          _id: '$agentId', // Group by agentId
          averageRating: { $avg: '$rating' }, // Calculate the average rating
          totalRaters: { $sum: 1 } // Count the total number of raters
        }
      }
    ]);

    // Extract the calculated average rating and total raters
    const { averageRating, totalRaters } = averageRatingResult[0] || { averageRating: 0, totalRaters: 0 };

    // Update the User model with the new average rating and total number of raters
    const updatedUser = await User.findOneAndUpdate(
      { _id: userId },
      { avgRating: averageRating, totalRaters: totalRaters },
      { new: true, runValidators: true } // Return the updated document
    );

    if (!updatedUser) {
      return { message: 'User not found' };
    }

    // Return the ratings and updated average rating
    res.json({ 
      message: 'Ratings fetched and user updated successfully',
      ratings,
      averageRating,
      totalRaters 
    });

  } catch (error) {
    console.error('Error fetching and updating agent rating:', error);
    // res.status(500).json({ message: 'Error fetching and updating agent rating', error });
    if (!res.headersSent) {
      return res.status(500).json({ message: 'Error fetching and updating agent rating', error });
    }
  }
};
async function authorizeOAuth2(): Promise<OAuth2Client> {
  const { HARISH_IDD, HARISH_ID, REDIRECT } = process.env;

  const oAuth2Client = new google.auth.OAuth2(
    HARISH_IDD,
    HARISH_ID,
    REDIRECT
  );

  // Optionally, you can set the refresh token if you have one
  // oAuth2Client.setCredentials({ refresh_token: 'YOUR_REFRESH_TOKEN' });

  return oAuth2Client;
}

// Create a Google Calendar event using OAuth2
async function createGoogleCalendarEvent(auth: OAuth2Client, rating: Events): Promise<void> {
  const calendar = google.calendar({ version: 'v3', auth });

  const event: calendar_v3.Schema$Event = {
    summary: `Meeting: ${rating.title}`,
    description: `Scheduled meet with ${rating.receiverUser}.`,
    start: {
      dateTime: new Date(rating.eventDate).toISOString(),
      timeZone: 'Asia/Kolkata',
    },
    end: {
      dateTime: new Date(new Date(rating.eventDate).getTime() + 30 * 60 * 1000).toISOString(), // 30 mins duration
      timeZone: 'Asia/Kolkata',
    },
    attendees: [{ email: rating.receiverUser }],
  };

  try {
    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event, // Changed `resource` to `requestBody` for TypeScript compatibility
    });
    console.log(`Event created: ${response.data?.htmlLink}`);
  } catch (error) {
    console.error('Error creating calendar event:', error);
  }
}

// Generate the Google Calendar event link
function generateGoogleCalendarLink(rating: Events,flag:boolean): string {
  // const startDateTime = new Date(rating.eventDate).toISOString();
  // const endDateTime = new Date(new Date(rating.eventDate).getTime() + 30 * 60 * 1000).toISOString(); // 30 mins duration
  // const eventSummary = encodeURIComponent(`Meeting: ${rating.title}`);
  // const eventDescription = encodeURIComponent(`Scheduled meet with ${rating.receiverUser}.`);
  // console.log("startDateTime",startDateTime);
  // console.log("endDateTime",endDateTime);
  // return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${eventSummary}&dates=${startDateTime}/${endDateTime}&details=${eventDescription}&attendees=${encodeURIComponent(rating.receiverUser)}`;
  const startDateTime = new Date(rating.eventDate);
  const endDateTime = new Date(startDateTime.getTime() + 30 * 60 * 1000); // 30 mins duration

  // Format date to 'YYYYMMDDTHHMMSS' (local time without 'Z')
  const formatDateTime = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}${month}${day}T${hours}${minutes}`;
  };

  // Use local time (Asia/Kolkata)
  const formattedStartDateTime = formatDateTime(startDateTime);
  const formattedEndDateTime = formatDateTime(endDateTime);

  const eventSummary = encodeURIComponent(`Meeting: ${rating.title}`);
  const eventDescription =flag? encodeURIComponent(`Scheduled meet with ${rating.schedulerUser}.`):encodeURIComponent(`Scheduled meet with ${rating.receiverUser}.`);

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${eventSummary}&dates=${formattedStartDateTime}/${formattedEndDateTime}&details=${eventDescription}&attendees=${encodeURIComponent(flag?rating.schedulerUser:rating.receiverUser)}`;

}

// Send email and add a calendar event using OAuth2
export const events = async (rating: Events) => {
  // Configure nodemailer for email
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // Generate Google Calendar link
  const googleCalendarLink = generateGoogleCalendarLink(rating,false);
  const googleCalendarLinkSender = generateGoogleCalendarLink(rating,true);
  console.log(googleCalendarLink.toString())
  console.log(googleCalendarLinkSender.toString())

  // Email details for scheduler
  const mailToSender = {
    from: process.env.EMAIL_USER,
    to: rating.schedulerUser,
    subject: `Schedule the Event on ${rating.eventDate}`,
    text: `You have scheduled a meet with ${rating.receiverUser}, title: ${rating.title}, scheduled on ${rating.eventDate}. \n\nAdd to your Google Calendar: ${googleCalendarLink}`,
  };

  // Email details for receiver
  const mailToReceiver = {
    from: process.env.EMAIL_USER,
    to: rating.receiverUser,
    subject: 'Schedule the Event',
    text: `The user having email Id ${rating.schedulerUser} has scheduled an Event with you, having title ${rating.title}, scheduled on ${rating.eventDate}. \n\nAdd to your Google Calendar: ${googleCalendarLinkSender}`,
  };

  // Send emails
  await transporter.sendMail(mailToSender);
  await transporter.sendMail(mailToReceiver);
  console.log('Emails sent successfully');

  // Authorize with OAuth2 and create a calendar event
  const auth = await authorizeOAuth2();
  await createGoogleCalendarEvent(auth, rating);
};