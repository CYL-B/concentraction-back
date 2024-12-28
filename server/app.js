/*https://www.apollographql.com/docs/apollo-server/api/express-middleware/*/

import express from "express";
import cors from "cors";
// import users from "../routes/users.js";
import "dotenv/config.js";
// import gql from "graphql-tag";
import { ApolloServer } from "@apollo/server";


import { buildSubgraphSchema } from "@apollo/subgraph";
import { expressMiddleware } from "@apollo/server/express4";
import resolvers from "./resolvers.js";
import { typeDefs } from "./schema.js";

// for token;
import jwt from "jsonwebtoken";

//authentification
import { UserModel } from "../models/user.js";

import { connect } from "../models/bddconnect.js";

const PORT = process.env.PORT_SERVER || 5050;
const app = express();

// Our httpServer handles incoming requests to our Express app.

// const httpServer = http.createServer(app);

app.use(cors());
app.use(express.json());
//DB connection
connect();

//verifies the JWT token and retrieves the user from the database.
const authenticate = async (token) => {
  //  extracts a user token from the HTTP Authorization header included in each operation
  //cf apollo client, token is included in headers
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      const user = await UserModel.findById(decoded.id);
      return user;
    } catch (err) {
      console.error(err);
      throw new GraphQLError('User is not authenticated', {
        extensions: {
          code: 'UNAUTHENTICATED',
          http: { status: 401 },
        },
      });
    }
  }
};

// context function in Apollo Server receives the request object,
//runs the authenticate function, and attaches the user to the context.
const server = new ApolloServer({
  schema: buildSubgraphSchema({
    typeDefs,
    resolvers
  }),
});

// Note you must call `start()` on the `ApolloServer`
// instance before passing the instance to `expressMiddleware`
await server.start();

// Specify the path to mount the server
app.use("/graphql", cors(), express.json(), expressMiddleware(server, {
  context: async ({ req }) => {
    const token = req.headers.authorization;
    const user = await authenticate(token);
    return { user };
  }
}));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

// start the Express server
app.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});

export default app;
