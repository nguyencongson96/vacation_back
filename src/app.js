import * as dotenv from 'dotenv';
dotenv.config();
import cors from 'cors';
import express from 'express';
import mongoose from 'mongoose';
import errHandler from '#root/middleware/errHandler';
import credentials from '#root/middleware/credentials';
import dbConnect from '#root/config/dbConnect';
import corsOptions from '#root/config/corsOption';
import pathArr from '#root/routes/index';
import internalTasks from '#root/services/internalTasks';
import { publicPath } from '#root/config/path';
import firebase from '#root/services/firebase';
import { getFirestore } from 'firebase/firestore';

// create an instance of an Express application
const app = express();
// set the port number for the server to listen on
const PORT = 3100;

//build-in middleware for static files
app.use('/static', express.static(publicPath));

//Connect to database
await dbConnect();

//Connect to firebase
await firebase();
export const firestore = getFirestore();

//Run internal Task
internalTasks();

//Handle options credentials check
app.use(credentials);

//build-in middleware to handle urlencoded data
app.use(express.urlencoded({ extended: true }));

// Parse JSON request bodies
app.use(express.json());

// Enable Cross-Origin Resource Sharing
app.use(cors());

// use router for handling requests
pathArr.forEach(({ path, route }) => app.use(path, route));

// use middleware for handling errors
app.use(errHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  mongoose.connection.once('open', () => console.log('Connected to MongoDB')).on('error', err => console.log(err));
});
