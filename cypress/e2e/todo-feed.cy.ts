const BASE_URL = "http://localhost:3000";

describe("/ - Todos Feed", () => {
    it("when load, renders the page", () => {
        cy.visit(BASE_URL);
    });

    it("when create a new todo, it must appears in the screen", () => {
        cy.intercept("POST", `${BASE_URL}/api/todos`, (request) => {
            request.reply({
                statusCode: 201,
                body: {
                    todo: {
                        id: "65ec84aa-ccd5-4a0c-a63b-06f052b686da",
                        date: "2023-06-13T22:52:16.252Z",
                        content: "Teste todo",
                        done: false,
                    },
                },
            });
        }).as("createTodo");

        cy.visit(BASE_URL);

        const inputAddTodo = "input[name='add-todo']";
        cy.get(inputAddTodo).type("Teste todo");

        const buttonAddTodo = "[aria-label='Adicionar novo item']";
        cy.get(buttonAddTodo).click();

        cy.get("table > tbody").contains("Teste todo");
    });
});
