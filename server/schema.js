//tagged templage literal to wrap graphql strings, converts graphql into a format that Apollo expects
import gql from "graphql-tag";

export const typeDefs = gql`
  "Get User when connected or created"
  type Query {
    "get user"
    getUser: User!
    "get tasks of the user"
    getTasks: TasksOfUser
  }

  type Mutation {
    "create an account for new user, returns AuthPayload"
    addUser(name: String!, content: UserInput!): AuthPayloadResponse!
    "update user's information, returns user"
    updateUser(
      id: ID!
      name: String
      password: String
      email: String
    ): UpdateUserResponse!
    "login an existing user, returns AuthPayload"
    login(content: UserInput!): AuthPayloadResponse!
    "create a new task"
    addTask(content: TaskContent!): AddTaskResponse
    "delete a task"
    deleteTask(id: ID!): Task!

    "update a task"
    updateTask(id: ID!, content: TaskContent!): UpdateTaskResponse!
  }

  "Information to provide as argument of user, used in signup and login"
  input UserInput {
    email: String!
    password: String!
  }

  "Information to provide as argument of task"
  input TaskContent {
    name: String!
    priority: Priority
    category: Category!
    status: Status!
    startDate: String
    endDate: String
    desc: String
  }

  "Tasks of user"
  type TasksOfUser {
    code: Int!
    success: Boolean!
    message: String!
    user: User!
  }

  "Identification of a user"
  type AuthPayloadResponse {
    "Similar to HTTP status code"
    code: Int!
    "Indicates if the request was successful"
    success: Boolean!
    "Human readable message for the UI"
    message: String!
    token: String
    "User created or logged in"
    user: User
  }

  "User response"
  type UpdateUserResponse {
    code: Int!
    success: Boolean!
    message: String!
    user: User
  }

  "Add task response"
  type AddTaskResponse {
    code: Int!
    success: Boolean!
    message: String!
    task: Task
  }
  
  "Update task response"
  type UpdateTaskResponse {
    code: Int!
    success: Boolean!
    message: String!
    task: Task
  }


  "Schema designed to describe an user, its tasks and objectives"
  type User {
    id: ID!
    name: String!
    password: String!
    email: String!
    "Tasks assigned to the specific USER"
    tasks: [Task]
    "Objectives assigned to the specific USER"
    objectives: [Objective]
  }

  "Schema designed to describe a task"
  type Task {
    id: ID!
    name: String!
    priority: Priority
    category: Category!
    status: Status!
    startDate: String
    endDate: String
    desc: String
  }

  "Schema designed to describe an objective"
  type Objective {
    title: String!
    status: Boolean!
  }

  "Restricts the values for property Category"
  enum Category {
    WORK
    PERSONAL
    PHOTOGRAPHY
    ARTICLES
    OTHER
  }

  "Restricts the values for property Priority"
  enum Priority {
    LOW
    MEDIUM
    HIGH
  }


  "Restricts the values for property Status"
  enum Status {
    TODO
    ONGOING
    DONE
  }
`;
