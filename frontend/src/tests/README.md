# PromptSharp Guardrails Tests

This directory contains test cases for the PromptSharp guardrails system. These tests help ensure that the toxicity detection, harmful intent detection, PII protection, and other safety features are working correctly.

## Test Files

- `guardrailsTests.js` - General tests for all guardrails features
- `angryEmailTests.js` - Specific tests for the "angry email" detection scenario
- `apiGuardrailsTests.js` - Tests for API integration with guardrails
- `guardrailsTestRunner.html` - Browser-based test runner
- `runTests.js` - Command-line test runner

## Running Tests

### Browser-based Testing (Recommended)

1. Start the PromptSharp frontend server:
   ```
   cd frontend
   npm run dev
   ```

2. Open the test runner in your browser:
   ```
   http://localhost:5173/tests/guardrailsTestRunner.html
   ```

3. Use the buttons to run different test suites:
   - "Run All Tests" - Runs all general guardrails tests
   - "Test Angry Email Cases" - Tests specifically for angry email detection
   - "Test API Integration" - Tests that the API correctly handles toxic prompts

4. You can also test individual prompts using the text input box and "Test This Prompt" button.

### Command-line Testing

You can run the tests from the command line using Node.js with ESM support:

```
cd frontend
node --experimental-modules src/tests/runTests.js
```

## Test Cases

The test suites include the following categories of tests:

1. **Toxicity Detection**
   - Profanity
   - Harassment
   - Violence
   - Hate speech
   - Targeted negative communication

2. **Harmful Intent Detection**
   - Manipulation
   - Emotional harm
   - Angry/hostile communication patterns

3. **PII Protection**
   - Email addresses
   - Phone numbers
   - Names
   - Addresses

4. **API Integration**
   - Verification that toxic prompts are blocked from optimization
   - Confirmation that appropriate fallback responses are provided

## Adding New Tests

To add new test cases:

1. Add them to the appropriate test file based on category
2. Or create a new test file for a specific feature
3. Follow the existing pattern of creating objects with:
   - `name`: Descriptive name of the test
   - `prompt`: The prompt to test
   - `expectedResult`: Whether it should pass validation (true) or fail (false)

## Troubleshooting

If the tests aren't working as expected:

1. Check the browser console for errors
2. Verify that the frontend server is running
3. Make sure the imports are correctly pointing to the right files
4. Check that the guardrails.js service is properly implemented
