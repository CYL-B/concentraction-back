import { MongoClient, ServerApiVersion } from "mongodb";
import mongoose from "mongoose";

// // const URI = process.env.ATLAS_URI || "";
// const client = new MongoClient(URI, {
//   serverApi: {
//     version: ServerApiVersion.v1,
//     strict: true,
//     deprecationErrors: true,
//   },
// });


// try {
//   // Connect the client to the server
//   await client.connect();
//   // Send a ping to confirm a successful connection
//   await client.db("admin").command({ ping: 1 });
//   console.log("Pinged your deployment. You successfully connected to MongoDB!");
// } catch (err) {
//   console.error(err);
// }

// let db = client.db("concentraction");

// export default db;
const URI = process.env.ATLAS_URI;

var options = {
  connectTimeoutMS: 5000,
  useNewUrlParser: true,
  useUnifiedTopology : true
 }

export async function connect () {
  return mongoose
  .connect(URI, options)
  .then(() => {
    console.log("MongoDB Connected Successfully");
  })};