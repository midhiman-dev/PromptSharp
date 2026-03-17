// Command line test runner for guardrails tests
import guardrails from '../services/guardrails.js';

// Import the test suites
import { testGuardrails } from './guardrailsTests.js';
import { testAngryEmailScenarios } from './angryEmailTests.js';

// Run the tests
async function runAllTests() {
  try {
    console.log('\n----- RUNNING GENERAL GUARDRAILS TESTS -----\n');
    await testGuardrails();
    
    console.log('\n----- RUNNING ANGRY EMAIL TESTS -----\n');
    await testAngryEmailScenarios();
    
    console.log('\nAll tests completed.');
  } catch (error) {
    console.error('Error running tests:', error);
  }
}

runAllTests();
