// cypress.config.js

const { defineConfig } = require("cypress");

module.exports = defineConfig({
    e2e: {
        // 1. Set the baseUrl to the Dashboard
        baseUrl: 'https://store-qusj6k6s.saleor.cloud/dashboard',

        // 2. Timeout configurations
        pageLoadTimeout: 150000,         // 2 minutes for page loads
        defaultCommandTimeout: 60000,    // 1 minute for commands
        execTimeout: 60000,              // 1 minute for exec commands
        taskTimeout: 60000,              // 1 minute for tasks
        requestTimeout: 60000,           // 1 minute for API requests

        // 3. Screenshot configurations
        screenshotOnRunFailure: true,
        screenshotsFolder: 'cypress/screenshots',
        screenshotTimeout: 60000,        // 1 minute for screenshots
        trashAssetsBeforeRuns: false,    // Keep screenshots for debugging

        // 4. Video configurations (optional - disable if not needed)
        video: false,                    // Disable video recording to improve performance
        videoCompression: false,
        videoUploadOnPasses: false,

        // 5. Viewport settings
        viewportWidth: 1920,
        viewportHeight: 1080,

        // 6. Retry configuration
        retries: {
            runMode: 1,                    // Retry once in CI
            openMode: 0                    // No retry in interactive mode
        },

        // 7. Response timeouts
        responseTimeout: 60000,
        chromeWebSecurity: false,        // Disable if you need cross-origin support

        // 8. Experimental features (if needed)
        experimentalMemoryManagement: true,
        experimentalModifyObstructiveThirdPartyCode: true,

        // 9. Node events setup
        setupNodeEvents(on, config) {
            // implement node event listeners here

            // Optional: Add custom tasks if needed
            on('task', {
                log(message) {
                    console.log(message);
                    return null;
                },
            });

            return config;
        },
    },

    // 10. Global configurations
    numTestsKeptInMemory: 25,          // Reduce memory usage
    watchForFileChanges: false,        // Disable auto-reload in CI
    defaultBrowser: 'chrome',          // Specify default browser

    // 11. Component testing (if using)
    component: {
        devServer: {
            framework: 'react',
            bundler: 'webpack',
        },
    },
});