import type { Task_M, Task } from "./types.ts";

export const fromModelToTask = (model: Task_M): Task => ({
  id: model._id!.toString(),
  title: model.title,
  completed: model.completed,
});
