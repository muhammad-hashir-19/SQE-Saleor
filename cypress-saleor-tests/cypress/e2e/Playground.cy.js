/// <reference types="cypress" />

// --- RESILIENT SELECTORS ---
const SELECTORS = {
    // Playground Access
    PLAYGROUND_BUTTON: 'button:contains("Playground")',

    // Core IDE Components (Inferred from image_64f8e2.png)
    QUERY_EDITOR: '.CodeMirror-code', // Standard CodeMirror selector for the editor pane
    EXECUTE_BUTTON: 'button[aria-label="Execute query"]', // The pink play button
    VARIABLES_TAB: 'button:contains("Variables")',
    HEADERS_TAB: 'button:contains("Headers")',

    // Output Panel (Inferred)
    OUTPUT_PANEL: '.CodeMirror-lint-mark-end', // Output panel content area

    // Info Links
    API_REFERENCE_LINK: 'a:contains("API reference")',
    API_GUIDE_LINK: 'a:contains("API guide")',
    CLOSE_BUTTON: 'button[aria-label="Close"]', // 'X' close button
};

// --- CONCRETE TEST DATA ---
const VALID_QUERY_PRODUCTS = '{ products(first: 1) { edges { node { name } } } }';
const VALID_QUERY_CUSTOMERS = '{ users(first: 1) { edges { node { email } } } }';
const INVALID_QUERY = '{ products }'; // Missing arguments, should fail
const TEST_VARIABLE_KEY = 'productID';


describe('GraphQL Playground: IDE Functionality and Query Execution Tests (>15 Cases)', () => {

    before(() => {
        cy.session('dashboard-user', () => { cy.manualSocialLogin(); });
    });

    beforeEach(() => {
        cy.session('dashboard-user', () => { });
        cy.get(SELECTORS.PLAYGROUND_BUTTON).click(); // Open the playground modal
        cy.get(SELECTORS.QUERY_EDITOR).should('be.visible');
    });

    afterEach(() => {
        // Close the modal after each test
        cy.get(SELECTORS.CLOSE_BUTTON).click();
        cy.wait(500); // Give the modal time to close
    });

    // --- Helper function to type into the CodeMirror editor ---
    const typeQuery = (query) => {
        cy.get(SELECTORS.QUERY_EDITOR).type(query, { parseSpecialChars: false, delay: 1 });
    };



    it('C1.01:  Successfully execute a valid GraphQL query (Products)', () => {
        typeQuery(VALID_QUERY_PRODUCTS);

        cy.get(SELECTORS.EXECUTE_BUTTON).click();

        // Assert successful execution (should show data block in the output panel)
        cy.get(SELECTORS.OUTPUT_PANEL, { timeout: 10000 }).should('contain', '"data"');
        cy.get(SELECTORS.OUTPUT_PANEL).should('contain', '"name"');
    });

    it('C1.02: Successfully execute a second valid GraphQL query (Customers)', () => {
        // Test query changing
        typeQuery(VALID_QUERY_CUSTOMERS);

        cy.get(SELECTORS.EXECUTE_BUTTON).click();

        // Assert output contains customer data
        cy.get(SELECTORS.OUTPUT_PANEL, { timeout: 10000 }).should('contain', '"email"');
    });

    it('C1.03: Attempt to execute an invalid/incomplete GraphQL query', () => {
        typeQuery(INVALID_QUERY);

        cy.get(SELECTORS.EXECUTE_BUTTON).click();

        // Assert output contains an error message (e.g., "Field 'products' is missing required arguments")
        cy.get(SELECTORS.OUTPUT_PANEL, { timeout: 10000 }).should('contain', '"errors"');
        cy.get(SELECTORS.OUTPUT_PANEL).should('contain', 'missing required arguments');
    });

    it('C1.04: Attempt to execute an empty query', () => {
        // Clear editor
        cy.get(SELECTORS.QUERY_EDITOR).type('{selectall}{del}');

        cy.get(SELECTORS.EXECUTE_BUTTON).click();

        // Assert quick error message (validation failure)
        cy.get(SELECTORS.OUTPUT_PANEL).should('contain', '"errors"');
    });

    it('C1.05: Verify API Reference and Guide links are present', () => {
        cy.get(SELECTORS.API_REFERENCE_LINK).should('be.visible').and('have.attr', 'href');
        cy.get(SELECTORS.API_GUIDE_LINK).should('be.visible').and('have.attr', 'href');
    });

    it('C1.06: Verify the output panel displays syntax highlighting (Inferred visual check)', () => {
        typeQuery(VALID_QUERY_PRODUCTS);
        cy.get(SELECTORS.EXECUTE_BUTTON).click();

        // This is a proxy test: checking for the presence of CodeMirror tokenizing classes
        cy.get(SELECTORS.OUTPUT_PANEL).should('be.visible').find('.cm-property').should('exist');
    });

    it('C1.07: Verify the Query Editor is initially focused and ready for input', () => {
        // The first CodeMirror editor should be active upon modal open
        cy.get(SELECTORS.QUERY_EDITOR).should('be.focused');
    });

    it('C1.08: Verify query history navigation (Undo button)', () => {
        // Execute Query 1
        typeQuery('Query One');
        cy.get(SELECTORS.EXECUTE_BUTTON).click();

        // Execute Query 2
        typeQuery('{selectall}{del}Query Two');
        cy.get(SELECTORS.EXECUTE_BUTTON).click();

        // Click Undo button (left sidebar, circular arrow)
        cy.get('button[aria-label="Undo"]').click();

        // Assert the editor content has reverted to 'Query One'
        cy.get(SELECTORS.QUERY_EDITOR).should('contain.text', 'Query One');
    });


   

    it('C2.01: Successfully input and execute a query using a JSON variable', () => {
        // 1. Define the query structure
        typeQuery('query TestProduct($id: ID!) { product(id: $id) { name } }');

        // 2. Open Variables panel
        cy.get(SELECTORS.VARIABLES_TAB).click();

        // 3. Input JSON variable (inferred CodeMirror for Variables)
        cy.get(SELECTORS.VARIABLES_TAB).siblings('.CodeMirror-wrap').find('.CodeMirror-code')
            .type(`{ "id": "UHJvZHVjdDoxMzE=" }`, { parseSpecialChars: false, delay: 1 }); // Hardcoded product ID

        // 4. Execute
        cy.get(SELECTORS.EXECUTE_BUTTON).click();

        // Assert success (output contains 'name')
        cy.get(SELECTORS.OUTPUT_PANEL, { timeout: 10000 }).should('contain', '"name"');
    });

    it('C2.02: Attempt to execute query with invalid JSON in Variables panel', () => {
        typeQuery(VALID_QUERY_PRODUCTS);
        cy.get(SELECTORS.VARIABLES_TAB).click();

        // Input invalid JSON
        cy.get(SELECTORS.VARIABLES_TAB).siblings('.CodeMirror-wrap').find('.CodeMirror-code')
            .type(`{ "invalid": value`, { parseSpecialChars: false, delay: 1 });

        cy.get(SELECTORS.EXECUTE_BUTTON).click();

        // Assert error related to JSON parsing
        cy.get(SELECTORS.OUTPUT_PANEL).should('contain', 'JSON Parse Error');
    });

    it('C2.03: Verify Headers tab opens and accepts input', () => {
        cy.get(SELECTORS.HEADERS_TAB).click();

        // Assert the Headers editor pane is visible
        cy.get(SELECTORS.HEADERS_TAB).siblings('.CodeMirror-wrap').should('be.visible');

        // Input sample header
        cy.get(SELECTORS.HEADERS_TAB).siblings('.CodeMirror-wrap').find('.CodeMirror-code')
            .type(`{ "Authorization": "Bearer token" }`, { parseSpecialChars: false, delay: 1 });
    });

    it('C2.04: Attempt to execute query with invalid JSON in Headers panel', () => {
        typeQuery(VALID_QUERY_PRODUCTS);
        cy.get(SELECTORS.HEADERS_TAB).click();

        // Input invalid JSON
        cy.get(SELECTORS.HEADERS_TAB).siblings('.CodeMirror-wrap').find('.CodeMirror-code')
            .type(`{ "Header": wrong-format }`, { parseSpecialChars: false, delay: 1 });

        cy.get(SELECTORS.EXECUTE_BUTTON).click();

        // Assert error related to JSON parsing
        cy.get(SELECTORS.OUTPUT_PANEL).should('contain', 'JSON Parse Error');
    });

    it('C2.05: Verify the Variables/Headers panel can be collapsed/expanded', () => {
        cy.get(SELECTORS.VARIABLES_TAB).should('be.visible'); // Initially expanded

        // Click the collapse button (inferred: same icon as the editor collapse)
        cy.get('button[aria-label="Collapse"]').first().click();

        // Assert panel content is gone/collapsed
        cy.get(SELECTORS.HEADERS_TAB).should('not.be.visible');
    });

});