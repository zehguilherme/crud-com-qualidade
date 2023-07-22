import { HttpNotFoundError } from "@server/infra/errors";
import { todoRepository } from "@server/repository/todo";
import { NextApiRequest, NextApiResponse } from "next";
import { z as schema } from "zod";

const TodoCreateBodySchema = schema.object({
    content: schema.string(),
});

async function get(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = {
        page: searchParams.get("page"),
        limit: searchParams.get("limit"),
    };
    const page = Number(query.page);
    const limit = Number(query.limit);

    if (query.page && isNaN(page)) {
        return new Response(
            JSON.stringify({
                error: {
                    message: "`page` must be a number",
                },
            }),
            {
                status: 400,
            }
        );
    }

    if (query.limit && isNaN(limit)) {
        return new Response(
            JSON.stringify({
                error: {
                    message: "`limit` must be a number",
                },
            }),
            {
                status: 400,
            }
        );
    }

    const output = await todoRepository.get({
        page: page,
        limit: limit,
    });

    return new Response(
        JSON.stringify({
            total: output.total,
            pages: output.pages,
            todos: output.todos,
        }),
        {
            status: 200,
        }
    );
}

async function create(request: Request) {
    const body = TodoCreateBodySchema.safeParse(await request.json());

    if (!body.success) {
        return new Response(
            JSON.stringify({
                error: {
                    message: "You need to provide a content to create a TODO",
                    description: body.error.issues,
                },
            }),
            {
                status: 400,
            }
        );
    }

    try {
        const createdTodo = await todoRepository.createByContent(
            body.data.content
        );

        return new Response(
            JSON.stringify({
                todo: createdTodo,
            }),
            {
                status: 201,
            }
        );
    } catch (error) {
        return new Response(
            JSON.stringify({
                error: {
                    message: "Failed to create todo",
                },
            }),
            {
                status: 400,
            }
        );
    }
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

async function deleteById(request: NextApiRequest, response: NextApiResponse) {
    const QuerySchema = schema.object({
        id: schema.string().uuid().nonempty(),
    });

    const parsedQuery = QuerySchema.safeParse(request.query);

    if (!parsedQuery.success) {
        response.status(400).json({
            error: {
                message: "You must to provide a valid id",
            },
        });

        return;
    }

    try {
        const todoId = parsedQuery.data.id;

        await todoRepository.deleteById(todoId);

        response.status(204).end();
    } catch (err) {
        if (err instanceof HttpNotFoundError) {
            return response.status(err.status).json({
                error: {
                    message: err.message,
                },
            });
        }

        response.status(500).json({
            error: {
                message: "Internal server error",
            },
        });
    }
}

export const todoController = {
    get,
    create,
    toggleDone,
    deleteById,
};
