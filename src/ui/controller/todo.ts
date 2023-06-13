import { todoRepository } from "@ui/repository/todo";
import { Todo } from "@ui/schema/todo";
import { z as schema } from "zod";

interface TodoControllerGetParams {
    page: number;
}

interface TodoControllerCreateParams {
    content?: string;
    onError: (customMessage?: string) => void;
    onSuccess: (todo: Todo) => void;
}

interface TodoControllerToggleDoneParams {
    id: string;
    updateTodoOnScreen: () => void;
    onError: () => void;
}

async function get({ page }: TodoControllerGetParams) {
    return todoRepository.get({ page: page, limit: 2 });
}

function filterTodosByContent<Todo>(
    todos: Array<Todo & { content: string }>,
    search: string
): Array<Todo> {
    const homeTodos = todos.filter((todo) => {
        const searchNormalized = search.toLowerCase();
        const contentNormalized = todo.content.toLowerCase();

        return contentNormalized.includes(searchNormalized);
    });

    return homeTodos;
}

function create({ content, onSuccess, onError }: TodoControllerCreateParams) {
    const parsedParams = schema.string().nonempty().safeParse(content);

    if (!parsedParams.success) {
        onError();

        return;
    }

    todoRepository
        .createByContent(parsedParams.data)
        .then((newTodo) => {
            onSuccess(newTodo);
        })
        .catch(() => {
            onError();
        });
}

function toggleDone({
    id,
    updateTodoOnScreen,
    onError,
}: TodoControllerToggleDoneParams) {
    // Optimistic update
    // updateTodoOnScreen();

    // Update real
    todoRepository
        .toggleDone(id)
        .then(() => {
            updateTodoOnScreen();
        })
        .catch(() => {
            onError();
        });
}

async function deleteById(id: string): Promise<void> {
    const todoId = id;

    await todoRepository.deleteById(todoId);
}

export const todoController = {
    get,
    filterTodosByContent,
    create,
    toggleDone,
    deleteById,
};
