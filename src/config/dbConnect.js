import mongoose from "mongoose";

const dbConnect = async () => {
  try {
    mongoose.set("strictQuery", true);
    await mongoose.connect(process.env.MONGO_URI);
  } catch (err) {
    console.log(err);
  }
};

export default dbConnect;
