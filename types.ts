import { ObjectId, OptionalId } from "mongodb";

//normales
export type Task = {
  id: string;
  title: string;
  completed: boolean;
};

//models
export type Task_M = OptionalId<{
  _id: ObjectId;
  title: string;
  completed: boolean;
}>;
