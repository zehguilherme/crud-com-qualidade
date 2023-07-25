import { todoController } from "@server/controller/todo";

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    const id = params.id;

    return new Response(`ID: ${id}`, {
        status: 200,
    });
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    return await todoController.deleteById(request, params.id);
}
