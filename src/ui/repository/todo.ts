import { Todo, TodoSchema } from "@ui/schema/todo";
import { z as schema } from "zod";

interface TodoRepositoryGetParams {
    page: number;
    limit: number;
}

interface TodoRepositoryGetOutput {
    todos: Todo[];
    total: number;
    pages: number;
}

function parseTodosFromServer(responseBody: unknown): {
    total: number;
    pages: number;
    todos: Array<Todo>;
} {
    if (
        responseBody !== null &&
        typeof responseBody === "object" &&
        "todos" in responseBody &&
        "total" in responseBody &&
        "pages" in responseBody &&
        Array.isArray(responseBody.todos)
    ) {
        return {
            total: Number(responseBody.total),
            pages: Number(responseBody.pages),
            todos: responseBody.todos.map((todo: unknown) => {
                if (todo === null && typeof todo !== "object") {
                    throw new Error("Invalid todo from API");
                }

                const { id, content, date, done } = todo as {
                    id: string;
                    content: string;
                    date: string;
                    done: string;
                };

                return {
                    id,
                    content,
                    done: String(done).toLowerCase() === "true",
                    date: date,
                };
            }),
        };
    }

    return { pages: 1, total: 0, todos: [] };
}

function get({
    page,
    limit,
}: TodoRepositoryGetParams): Promise<TodoRepositoryGetOutput> {
    return fetch(`/api/todos?page=${page}&limit=${limit}`).then(
        async (resposta) => {
            const todosString = await resposta.text();
            const responseParsed = parseTodosFromServer(
                JSON.parse(todosString)
            );

            return {
                total: responseParsed.total,
                todos: responseParsed.todos,
                pages: responseParsed.pages,
            };
        }
    );
}

export async function createByContent(content: string): Promise<Todo> {
    const response = await fetch("/api/todos", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            content,
        }),
    });

    if (response.ok) {
        const serverResponse = await response.json();

        const ServerResponseSchema = schema.object({
            todo: TodoSchema,
        });

        const serverResponseParsed =
            ServerResponseSchema.safeParse(serverResponse);

        if (!serverResponseParsed.success) {
            throw new Error("Failed to create TODO :(");
        }

        const todo = serverResponseParsed.data.todo;

        return todo;
    }

    throw new Error("Failed to create TODO :(");
}

async function toggleDone(todoId: string): Promise<Todo> {
    const response = await fetch(`/api/todos/${todoId}/toggle-done`, {
        method: "PUT",
    });

    if (response.ok) {
        const serverResponse = await response.json();

        const ServerResponseSchema = schema.object({
            todo: TodoSchema,
        });

        const serverResponseParsed =
            ServerResponseSchema.safeParse(serverResponse);

        if (!serverResponseParsed.success) {
            throw new Error(`Failed to update TODO with id ${todoId}`);
        }

        const updatedTodo = serverResponseParsed.data.todo;

        return updatedTodo;
    }

    throw new Error("Server error");
}

export const todoRepository = {
    get,
    createByContent,
    toggleDone,
};