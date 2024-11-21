//Paula Rodriguez y Sarah Rojas

//seguimos misma estructura del parcial

import { MongoClient, ObjectId } from "mongodb";
import { Task_M } from "./types.ts";
import { fromModelToTask } from "./utils.ts";

const MONGO_URL = Deno.env.get("MONGO_URL");

//Comprobamos DB URL
if (!MONGO_URL) {
  console.error("URL no valido");
  Deno.exit(1);
}

//Conexion cliente-DB
const client = new MongoClient(MONGO_URL);
await client.connect();
console.info("Conexion exitosa");

const db = client.db("Registro");
const TaskCollection = db.collection<Task_M>("Tareas");

//de toda la vida, async as we're waiting for responses
const handler = async (req: Request): Promise<Response> => {
  const method = req.method;
  const url = new URL(req.url);
  const path = url.pathname;

  //HTTP
  if (method === "GET") {
    if (path === "/tasks") {
      const tasksDB = await TaskCollection.find().toArray();
      const tasks = tasksDB.map((t) => fromModelToTask(t));
      return new Response(JSON.stringify(tasks));
    } else if (path.startsWith("/tasks/")) {
      const id = path.split("/")[2]; //para buscar unicamente con el id, sin la primera parte que es repetitiva.
      //El dos es acceder a la 3era pos del nuevo array que creamos, que sera nuestro id. -->Revise this for exam, NOT DONE IN THEORY CLASS.
      if (!id) {
        return new Response(
          JSON.stringify({ error: "No se encuentra el ID" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
      const tasksDB = await TaskCollection.findOne({ _id: new ObjectId(id) });
      if (!tasksDB) {
        return new Response("Tarea no encontrada", { status: 404 });
      }

      const task = await fromModelToTask(tasksDB);
      return new Response(JSON.stringify(task), { status: 201 });
    }
  } else if (method === "POST") {
    if (path === "/tasks") {
      const task = await req.json();
      if (!task.title || !task.completed) {
        return new Response("Bad request", { status: 400 });
      }
      const { insertedId } = await TaskCollection.insertOne({
        title: task.title,
        completed: task.completed,
      });

      //remember this is a new response de toda la vida, dont get it twisted
      return new Response(
        JSON.stringify({
          id: insertedId,
          title: task.title,
          completed: task.completed,
        }),
        { status: 201 }
      );
    }
  } else if (method === "PUT") {
    if (path.startsWith("/tasks")) {
      const id = path.split("/")[2];
      const tarea = await req.json(); //si ponemos task, no funciona abajo cuando le usamos en la trasnformacion, same but different.

      //Update not given in theory class --> review. No funciona any other way + no seguir quick fixes pq si arreglamos el any, it messes up the update. Leave it as is
      let update: any = {}; //initilized como empty object
      if (tarea.title) {
        update["title"] = tarea.title;
      }
      if ("completed" in tarea) {
        //Hemos tenido que usar "completed in tarea" debido a que "tarea.completed" no funcionaba bien
        update["completed"] = tarea.completed;
      }

      console.log(update);

      if (Object.keys(update).length === 0) {
        return new Response(
          "Se debe cambiar por lo menos una variable: (title, completed)",
          { status: 400 }
        );
      }

      const { modifiedCount } = await TaskCollection.updateOne(
        { _id: new ObjectId(id as string) },
        { $set: update }
      ); //same as book example done in class.

      //comprobacion
      if (modifiedCount === 0) {
        return new Response("Tarea no encontrada", { status: 404 });
      }

      const taskDB = await TaskCollection.findOne({ _id: new ObjectId(id) });
      if (!taskDB) {
        return new Response("Tarea no encontrada", { status: 404 });
      }
      const task = await fromModelToTask(taskDB);
      return new Response(JSON.stringify(task), { status: 201 });
    }
  } else if (method === "DELETE") {
    if (path.startsWith("/tasks")) {
      const id = path.split("/")[2];

      // Check if id is provided
      if (!id) {
        return new Response(
          JSON.stringify({ error: "El ID no se ha encontrado" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
      const deletedResult = await TaskCollection.deleteOne({
        _id: new ObjectId(id),
      });

      const response = { message: "Tarea eliminada exitosamente" };

      return new Response(JSON.stringify(response), {
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  //when others
  return new Response("Not found method", { status: 404 });
};

//
Deno.serve({ port: 3000 }, handler);
