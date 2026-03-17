# PromptSharp

PromptSharp is a lightweight AI-powered prompt optimization tool that transforms user-provided prompts into structured, well-formed, and highly effective prompts within seconds. It now includes robust guardrails for LLM safety and enhanced input/output validation.

## Features

- **Prompt Input Interface**: Clean, intuitive text area for user prompt input with character count
- **AI Model Selection**: Choose from available OpenRouter models with Mistral and Gemini as backup options
- **AI-Powered Prompt Optimization**: Core optimization engine using OpenRouter models
- **Side-by-Side Comparison**: Display original and optimized prompts for comparison
- **IndexedDB Storage**: Persistent storage of prompts using Dexie.js for improved performance
- **Prompt History & Management**: View, search, and manage previously optimized prompts
- **Advanced Guardrails**: Built-in safety features for LLM interactions
  - **Toxicity Detection**: Identifies harmful content, profanity, and negative language
  - **PII Protection**: Detects and redacts personally identifiable information
  - **Hallucination Detection**: Identifies potential factual inaccuracies in LLM responses
  - **Truthfulness Verification**: Checks responses against known facts
  - **Comprehensive Test Suite**: Automated testing for guardrail functionality

## Project Structure

```
PromptSharp/
├── .gitignore                 # Git ignore rules for dependencies and build files
├── LICENSE                    # Project license
├── README.md                  # This file
├── SIMPLIFIED-README.md       # Simplified version of the README
├── all-in-one.html            # Standalone HTML version for quick start
├── backend/                   # Backend server (Node.js/Express)
│   ├── package.json
│   ├── README.md
│   └── src/
│       ├── index.js
│       ├── controllers/
│       │   └── promptController.js
│       ├── routes/
│       │   └── index.js
│       ├── services/
│       │   └── promptService.js
│       └── utils/
│           ├── errors.js
│           └── setup.js
└── frontend/                  # Frontend application (React/Vite)
    ├── package.json
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── run-backend.ps1
    ├── run-frontend.ps1
    └── src/
        ├── App.js
        ├── main.js
        ├── index.html
        ├── styles.css
        ├── components/
        │   ├── ModelSelection.js
        │   ├── PromptCompare.js
        │   ├── PromptHistory.js
        │   └── PromptInput.js
        ├── services/
        │   ├── api.js
        │   ├── guardrails.js
        │   └── storage.js
        ├── styles/
        │   ├── styles.css
        │   └── tailwind.css
        ├── tests/
        │   ├── angryEmailTests.js
        │   ├── apiGuardrailsTests.js
        │   ├── guardrailsTestRunner.html
        │   ├── guardrailsTests.js
        │   ├── README.md
        │   └── runTests.js
        └── utils/
            └── renderer.js
```

## Two Ways to Use PromptSharp

### Option 1: Single-File HTML Version (Recommended for Quick Start)

If you want to avoid installation or build processes, you can use the all-in-one HTML version:

1. Simply open the `all-in-one.html` file in your browser
2. Enter your OpenRouter API key (pre-filled, but you can change it)
3. Enter your prompt and click "Improve with AI ✨"
4. View, copy, and save your optimized prompts

Features in the all-in-one version:
- Prompt optimization via OpenRouter API
- Side-by-side comparison
- Basic guardrails for safety
- Local storage for prompt history
- Export prompts to JSON

### Option 2: Full Application (Frontend + Backend)

For the complete application with all features and guardrails:

#### Prerequisites

- Node.js 14+
- npm or yarn

#### Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. The `.env` file is already set up with a test API key, or you can create your own:
   ```
   PORT=3000
   OPENROUTER_API_KEY=your_api_key_here
   ```

4. Start the development server:
   ```
   npm run dev
   ```

#### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:5173
   ```

#### VS Code Users: Run Both Frontend and Backend Together

We've included a VS Code task to run both servers simultaneously:

1. Open PromptSharp in VS Code
2. Press `Ctrl+Shift+P` and select "Tasks: Run Task"
3. Choose "Run PromptSharp (Backend & Frontend)"

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

## Guardrails & Safety Features

PromptSharp includes advanced guardrails to ensure safe, responsible, and high-quality prompt optimization:

- **Toxicity Detection**: Flags and blocks prompts containing profanity, harassment, violence, hate speech, self-harm, sexual content, illegal activity, manipulation, targeted negative language, and subtle harmful intent. Detection logic uses expanded regex patterns and heuristic checks for nuanced cases (e.g., "angry email" or indirect negative requests).
- **PII Protection**: Detects and redacts personally identifiable information (PII) such as emails, phone numbers, credit card numbers, IP addresses, and names. Technical/development context exclusion prevents false positives for code or product-related prompts.
- **Hallucination Detection**: Identifies and marks potential factual inaccuracies in LLM responses using a built-in knowledge base and pattern-based checks. Classifier logic is tunable for sensitivity.
- **Truthfulness Verification**: Checks output against known facts and scientific constants.
- **Logical Contradiction Checks**: Detects logical inconsistencies in prompts and responses.
- **Configurable Guardrails**: Users can enable/disable individual guardrail features and strict mode from the UI.
- **Comprehensive Test Suite**: Built-in browser-based test runner for validating guardrail effectiveness, including edge cases and false positive prevention.

### Actionable Guidelines for Flagged Prompts
- Prompts flagged as toxic, manipulative, or containing PII are **not sent for optimization**. The UI displays a warning and provides fallback responses or suggestions for safer prompt phrasing.
- Guardrail issues are highlighted in the comparison view, with specific indicators for toxicity, PII, hallucination, and truthfulness.
- All guardrail statuses are stored and displayed in prompt history for transparency.

### Edge Case Handling & False Positive Prevention
- Expanded detection logic covers subtle harmful requests and targeted negative language, even without explicit terms (e.g., "make someone feel bad" or "hostile feedback").
- Technical/development prompts and AI tool/product questions are excluded from toxicity checks to avoid false positives.
- Thresholds and classifier logic for hallucination/truthfulness can be tuned in `guardrails.js` for optimal balance between safety and usability.

### Guardrails Test Suite
- Test cases cover angry/hostile email detection, harmful intent, PII, subtle negative expressions, and false positive scenarios.
- To run tests: open `frontend/src/tests/guardrailsTestRunner.html` in your browser and click "Run All Tests". Results are displayed with detailed indicators for each guardrail.
- Test output formatting highlights detected issues and provides clarity for edge cases.

## Best Practices & Guidelines

- Always review flagged prompts and use fallback suggestions to rephrase unsafe content.
- Enable strict mode for sensitive applications or when handling user-generated content at scale.
- Regularly run the test suite after updating guardrail logic to ensure coverage of new edge cases and prevention of false positives.
- Document any custom guardrail patterns or exclusions in `guardrails.js` for maintainability.
- For production deployments, monitor guardrail effectiveness and adjust thresholds as needed based on real-world usage and feedback.

## Building for Production

### Backend

```
cd backend
npm run build
```

### Frontend

```
cd frontend
npm run build
```

The production build will be in the `frontend/dist` directory, which can be deployed to any static hosting service.

## Troubleshooting

If you encounter errors:
1. Make sure your OpenRouter API key is valid
2. Check your internet connection
3. If the primary model fails, the app will automatically try the fallback model

The production build will be in the `frontend/dist` directory.

## License

MIT
