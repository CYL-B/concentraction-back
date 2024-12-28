// implementation of the GraphQL schema.
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

//import mongoose schemas
import { UserModel } from "../models/user.js";

//define a custom scalar for date type
import { GraphQLScalarType, Kind } from "graphql";

//https://www.apollographql.com/docs/apollo-server/schema/custom-scalars/
const dateScalar = new GraphQLScalarType({
  name: "Date",
  description: "Date custom scalar type",
  serialize(value) {
    if (value instanceof Date) {
      return value.getTime(); // Convert outgoing Date to integer for JSON
    }
    throw Error("GraphQL Date Scalar serializer expected a `Date` object");
  },
  parseValue(value) {
    if (typeof value === "number") {
      return new Date(value); // Convert incoming integer to Date
    }
    throw new Error("GraphQL Date Scalar parser expected a `number`");
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.INT) {
      // Convert hard-coded AST string to integer and then to Date
      return new Date(parseInt(ast.value, 10));
    }
    // Invalid hard-coded value (not an integer)
    return null;
  },
});

//_ : unused parameter
//(parent, args, contextValue, info), the order of the Args matters

const resolvers = {
  Date: dateScalar,
  Query: {
    // promise : if successful, get user, if not, return error
    getUser: async (_, { id }) => {
      try {
        let collection = await db.collection("users");
        let query = { _id: new ObjectId(id) };
        let user = await collection.findOne(query);

        return {
          code: 200,
          success: true,
          message: "Successfully retrieved user",
          user: user,
        };
      } catch (error) {
        //error.extensions.response: special extension that provide information on the error
        return {
          code: error.extensions.response.status,
          success: false,
          message: error.extensions.response.body,
          user: null,
        };
      }
    },

    getTasks: async (_, {}, contextValue) => {
      const user = contextValue.user;
      if (user) {
        const userID = user.id ?? user._id;
        // console.log("userID", userID);
        const findUser = await UserModel.findOne({ _id: userID });

        return {
          code: 200,
          success: true,
          message: "Successfully retrieved tasks",
          user: findUser,
        };
      } else {
        return {
          code: 401,
          success: false,
          message: "You don't have permission to retrieve tasks",
        };
      }
    },
    getObjectives: async (_, {}, contextValue) => {
      const user = contextValue.user;
      if (user) {
        const userID = user.id ?? user._id;
        // console.log("userID", userID);
        const findUser = await UserModel.findOne({ _id: userID });

        return {
          code: 200,
          success: true,
          message: "Successfully retrieved Objectives",
          user: findUser,
        };
      } else {
        return {
          code: 401,
          success: false,
          message: "You don't have permission to retrieve Objectives",
        };
      }
    },
  },
  //
  User: {
    //This resolver field is used to resolve the id field of a User object.
    id: (parent) => parent.id ?? parent._id,
    //used to resolve the tasks field of a User object : retrieve nested tasks
    tasks: async (user, args, contextValue) => {
      const tasks = user.tasks;
      // console.log("Tasks:", tasks); // Log tasks data
      return tasks;
    },
  },

  Mutation: {
    //creates a new user
    addUser: async (_, { name, content }, context) => {
      console.log("contexttry", context);
      const hashedPassword = await bcrypt.hash(content.password, 10);
      const email = content.email;
      const user = new UserModel({
        username: name,
        password: hashedPassword,
        email: email,
      });
      const newUser = await user.save();
      //creates token
      const token = jwt.sign({ id: user.id }, process.env.ACCESS_TOKEN_SECRET);
      if (newUser) {
        console.log("here");

        return {
          code: 200,
          success: true,
          message: "Successfully added new user",
          user: newUser,
          token: token,
        };
      } else {
        return {
          code: 401,
          success: false,
          message: "Failed to add new user",
        };
      }
    },

    //get user, compare password entered and password in database, create token
    login: async (_, { content }, context) => {
      const { email, password } = content;
      const user = await UserModel.findOne({ email });
      if (user && bcrypt.compareSync(password, user.password)) {
        const token = jwt.sign(
          { id: user.id },
          process.env.ACCESS_TOKEN_SECRET
        );
        return {
          code: 200,
          success: true,
          message: "Successfully logged in",
          user: user,
          token: token,
        };
      } else {
        return {
          code: 401,
          success: false,
          message: "Incorrect email or password",
        };
      }
    },

    //création de tâche
    addTask: async (_, { content }, contextValue) => {
      const { name, priority, category, status, startDate, endDate, desc } =
        content;

      const user = contextValue.user;
      if (user) {
        const userID = user.id ?? user._id;
        const addLatestTask = await UserModel.updateOne(
          { _id: userID },
          {
            $push: {
              tasks: {
                name,
                priority,
                category,
                status,
                startDate,
                endDate,
                desc,
              },
            },
          }
        );
        const findUser = await UserModel.findOne({ _id: userID });
        //retourne la tâche ajoutée, retrouve la position du dernier ajout
        const findLatestTask = findUser.tasks[findUser.tasks.length - 1];

        if (
          addLatestTask.acknowledged == true &&
          addLatestTask.modifiedCount == 1
        ) {
          return {
            code: 200,
            success: true,
            message: "Task successfully added",
            task: {
              id: findLatestTask.id,
              name: findLatestTask.name,
              priority: findLatestTask.priority,
              category: findLatestTask.category,
              status: findLatestTask.status,
              startDate: findLatestTask.startDate,
              endDate: findLatestTask.endDate,
              desc: findLatestTask.desc,
            },
          };
        }
      } else {
        return {
          code: 401,
          success: false,
          message: "You don't have permission to add a task",
        };
      }
    },

    //modification de la tâche
    updateTask: async (_, { id, content }, contextValue) => {
      const { name, category, status } = content;
      const user = contextValue.user;
      if (user) {
        const userID = user.id ?? user._id;
        const updateTask = await UserModel.updateOne(
          { _id: userID, "tasks._id": id},
          {
            $set: {
              "tasks.$.name": name,
              "tasks.$.category": category,
              "tasks.$.status": status,
            }
          }
        )

        const findUser = await UserModel.findOne({ _id: userID });
        const findTask = findUser.tasks.find((task) => task.id === id);
        if (updateTask.acknowledged == true && updateTask.modifiedCount == 1) {
          return {
            code: 200,
            success: true,
            message: "Task successfully updated",
            task: {
              id: findTask.id,
              name: findTask.name,
              priority: findTask.priority,
              category: findTask.category,
              status: findTask.status,
              startDate: findTask.startDate,
              endDate: findTask.endDate,
              desc: findTask.desc,
            },
          };
        }
      } else {
        return {
          code: 401,
          success: false,
          message: "You don't have permission to add a task",
        };
      }
    },
    //suppression de la tâche, logique à revoir

    deleteTask: async (_, { id, token }, context) => {
      // let collection = await db.collection("users");
      // const dbDelete = await collection.deleteOne({ _id: new ObjectId(id) });
      // return dbDelete.acknowledged && dbDelete.deletedCount == 1 ? true : false;
    },
  },
};

// },
// Mutation: {
//   async createRecord(_, { name, position, level }, context) {
//     let collection = await db.collection("users");
//     const insert = await collection.insertOne({ name, position, level });
//     if (insert.acknowledged)
//       return { name, position, level, id: insert.insertedId };
//     return null;
//   },
//   async updateRecord(_, args, context) {
//     const id = new ObjectId(args.id);
//     let query = { _id: new ObjectId(id) };
//     let collection = await db.collection("users");
//     const update = await collection.updateOne(
//       query,
//       { $set: { ...args } }
//     );

//     if (update.acknowledged)
//       return await collection.findOne(query);

//     return null;
//   },
//   async deleteRecord(_, { id }, context) {
//     let collection = await db.collection("users");
//     const dbDelete = await collection.deleteOne({ _id: new ObjectId(id) });
//     return dbDelete.acknowledged && dbDelete.deletedCount == 1 ? true : false;
//   },
// },

export default resolvers;
