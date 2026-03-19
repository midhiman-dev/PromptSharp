# PromptSharp Static

## How to Use This Version

This folder contains the standalone static version of PromptSharp. It requires no installation or build process.

### To Run PromptSharp:

1. Simply double-click the `index.html` file to open it in your browser
2. Enter your OpenRouter API key (get one at https://openrouter.ai if you don't have one)
3. Enter your prompt and click "Optimize"
4. View, copy, and save your optimized prompts

### Features Included:

- Prompt Input with character count
- AI Optimization via OpenRouter API (using your own API key)
- Side-by-Side Comparison
- Prompt History with search functionality
- Export prompts to JSON
- All data stored locally in your browser

## Example Prompt Optimizations

Here are real examples of how PromptSharp transforms basic prompts into highly effective ones:

### For Content Creators
**Original**: "I need a blog post idea about sustainable living that would appeal to millennials. Should be trendy but not preachy."

**Optimized**: "Generate a blog post idea about sustainable living that resonates with millennials. The idea should be trendy, engaging, and non-preachy. Consider current trends, millennial interests, and actionable tips for sustainable living. Provide a clear and concise pitch for the blog post."

### For Developers
**Original**: "I need to explain to my manager why we should refactor this legacy code instead of adding new features."

**Optimized**: "Draft a persuasive argument for my manager, outlining the benefits of refactoring our legacy codebase before adding new features. The argument should include:

1. The risks and challenges of adding new features to unrefactored legacy code.
2. The long-term benefits of refactoring, such as improved maintainability, scalability, and performance.
3. The potential cost savings from reduced technical debt and fewer bugs.
4. A suggested phased approach for refactoring alongside new feature development.
5. Relevant industry best practices or case studies that support this approach."

### For QA Testers
**Original**: "How to create test scenarios for edge cases in a payment processing system?"

**Optimized**: "Generate a comprehensive list of test scenarios for edge cases in a payment processing system. Ensure the scenarios cover the following aspects:

1. **Input Validation:**
   - Invalid or malformed payment details (e.g., incorrect card number, expiry date, CVV)
   - Empty or null input fields
   - Payment amount exceeding system limits

2. **Processing Scenarios:**
   - Insufficient funds or declined transactions
   - Duplicate transactions
   - Concurrent transactions (e.g., multiple payments at the same time)
   - Timeouts or delays in payment processing

3. **System Behavior:**
   - System crashes or failures during payment processing
   - Database errors or connection issues
   - Payment retries and rollbacks

4. **User Scenarios:**
   - User session expiration during payment
   - User navigating away from payment page during processing
   - Multiple users attempting to make a payment from the same account simultaneously

5. **Security Scenarios:**
   - SQL injection or other malicious inputs
   - Unauthorized access attempts
   - Payment data leakage or exposure

For each scenario, briefly describe the steps to reproduce, the expected result, and the purpose of the test. Assume the system supports multiple payment methods and currencies."

### For Students
**Original**: "Need help framing research questions for my psychology dissertation on social media usage."

**Optimized**: "Act as a psychology research assistant. I need help generating clear, focused, and researchable questions for my dissertation on social media usage. Provide at least five questions that cover different aspects of the topic, such as:

1. The psychological impacts of excessive social media use.
2. The relationship between social media usage and mental health indicators (e.g., anxiety, depression, self-esteem).
3. The role of social media in shaping social behaviors and relationships.
4. The effects of different types of social media content (e.g., passive consumption vs. active engagement) on users' well-being.
5. The potential moderating factors (e.g., age, gender, personality traits) in the relationship between social media use and psychological outcomes.

Ensure the questions are specific, measurable, and aligned with established psychological theories or models. Additionally, suggest suitable research methods for each question."

### For Business Users
**Original**: "Need talking points for a 5-minute presentation to potential investors about our startup."

**Optimized**: "Create a concise list of 5-7 compelling talking points for a 5-minute investor pitch about our startup. Each point should be clear, engaging, and highlight the unique value proposition, market opportunity, business model, traction, and vision of our company. Ensure the points are structured to build interest and excitement, with a strong call-to-action at the end."

## Performance Analysis

PromptSharp shows exceptional performance in transforming vague, general prompts into highly specific, structured, and effective ones. Here's what makes it valuable:

1. **Adds Structure**: Transforms unstructured requests into organized, numbered lists and clear sections.

2. **Enhances Specificity**: Adds critical details, examples, and clarifications that the original prompt lacks.

3. **Provides Context**: Incorporates relevant domain knowledge and best practices specific to each use case.

4. **Improves Clarity**: Eliminates ambiguity and ensures the request is precise and actionable.

5. **Adapts to Different Users**: Tailors optimization based on the context, whether for content creators, developers, QA testers, students, or business professionals.

The optimized prompts are significantly more likely to generate high-quality, relevant responses from AI systems, saving you time and improving your results.

### Notes:

- This version uses the browser's localStorage to save prompts
- Your API key is stored locally and never sent to any server except OpenRouter
- The maximum number of saved prompts is 100

### Troubleshooting:

If you encounter errors:
1. Make sure your OpenRouter API key is valid
2. Check your internet connection
3. Try using the fallback model if the primary model fails
