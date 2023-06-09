import { todoRepository } from "@server/repository/todo";
import { NextApiRequest, NextApiResponse } from "next";
import { z as schema } from "zod";

async function get(request: NextApiRequest, response: NextApiResponse) {
    const query = request.query;
    const page = Number(query.page);
    const limit = Number(query.limit);

    if (query.page && isNaN(page)) {
        response.status(400).json({
            error: {
                message: "`page` must be a number",
            },
        });

        return;
    }

    if (query.limit && isNaN(limit)) {
        response.status(400).json({
            error: {
                message: "`limit` must be a number",
            },
        });

        return;
    }

    const output = todoRepository.get({
        page: page,
        limit: limit,
    });

    response.status(200).json({
        total: output.total,
        pages: output.pages,
        todos: output.todos,
    });
}

const TodoCreateBodySchema = schema.object({
    content: schema.string(),
});

async function create(request: NextApiRequest, response: NextApiResponse) {
    const body = TodoCreateBodySchema.safeParse(request.body);

    if (!body.success) {
        response.status(400).json({
            error: {
                message: "You need to provide a content to create a TODO",
                description: body.error.issues,
            },
        });

        return;
    }

    const createdTodo = await todoRepository.createByContent(body.data.content);

    response.status(201).json({
        todo: createdTodo,
    });
}

async function toggleDone(request: NextApiRequest, response: NextApiResponse) {
    const todoId = request.query.id;

    if (!todoId || typeof todoId !== "string") {
        response.status(400).json({
            error: {
                message: "You must to provide a string ID",
            },
        });

        return;
    }

    try {
        const updatedTodo = await todoRepository.toggleDone(todoId);

        response.status(200).json({
            todo: updatedTodo,
        });
    } catch (error) {
        if (error instanceof Error) {
            response.status(404).json({
                error: {
                    message: error.message,
                },
            });
        }
    }
}

export const todoController = {
    get,
    create,
    toggleDone,
};
