// Guardrails service for PromptSharp
// Handles input/output validation and real-time monitoring for LLM safety

// Create a profanity filter without using the problematic library
// This is a simplified implementation that will be used instead of 'bad-words'
import nlp from 'compromise';

// Simple profanity list to replace bad-words library
const PROFANITY_LIST = [
  'damn', 'hell', 'crap', 'ass', 'asshole', 'bastard', 
  'bitch', 'shit', 'fuck', 'motherfucker', 'piss', 'slut',
  'whore', 'dick', 'pussy', 'cunt'
];

// Create our own basic profanity filter
const badWordsFilter = {
  isProfane: (text) => {
    if (!text) return false;
    const lowerText = text.toLowerCase();
    return PROFANITY_LIST.some(word => 
      lowerText.includes(word) || 
      // Simple way to catch partially censored profanity
      lowerText.includes(word.charAt(0) + '*' + word.charAt(word.length-1))
    );
  },
  clean: (text) => {
    if (!text) return text;
    let result = text;
    PROFANITY_LIST.forEach(word => {
      const regex = new RegExp('\\b' + word + '\\b', 'gi');
      const asterisks = '*'.repeat(word.length);
      result = result.replace(regex, asterisks);
    });
    return result;
  }
};

// PII patterns for detection
const PII_PATTERNS = {
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,
  phone: /\b(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/,
  ssn: /\b\d{3}[-]?\d{2}[-]?\d{4}\b/,
  creditCard: /\b(?:\d[ -]*?){13,16}\b/,
  ipAddress: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/,
  address: /\d{1,5}\s[A-z]{1,2}[0-9]{1,5}\s([A-z]+\s)+/
};

// Expanded factual knowledge base for truthfulness verification
const FACTUAL_KNOWLEDGE = {
  // Historical dates
  "World War II": { startYear: 1939, endYear: 1945 },
  "World War I": { startYear: 1914, endYear: 1918 },
  "American Civil War": { startYear: 1861, endYear: 1865 },
  "Cold War": { startYear: 1947, endYear: 1991 },
  "Vietnam War": { startYear: 1955, endYear: 1975 },
  "Korean War": { startYear: 1950, endYear: 1953 },
  "French Revolution": { startYear: 1789, endYear: 1799 },
  "Russian Revolution": { startYear: 1917, endYear: 1923 },
  "American Revolution": { startYear: 1775, endYear: 1783 },
  
  // Scientific facts
  "Earth": { 
    atmosphere: ["nitrogen", "oxygen", "argon", "carbon dioxide"], 
    orbits: "sun",
    moons: 1,
    surfaceWater: "71%",
    diameter: "12,742 km"
  },
  "Moon": { 
    orbits: "earth", 
    diameter: "3,474 km",
    gravity: "1.62 m/s²",
    distance: "384,400 km"
  },
  "Water": { 
    formula: "H2O", 
    boilingPoint: 100,
    freezingPoint: 0,
    density: "1000 kg/m³"
  },
  "Sun": {
    type: "star",
    diameter: "1,392,678 km",
    age: "4.6 billion years",
    surfaceTemp: "5,778 K"
  },
  
  // Geography
  "continents": ["Asia", "Africa", "North America", "South America", "Antarctica", "Europe", "Australia"],
  "oceans": ["Pacific", "Atlantic", "Indian", "Southern", "Arctic"],
  
  // Science constants
  "speed of light": "299,792,458 m/s",
  "pi": "3.14159",
  "gravity": "9.8 m/s²",
  
  // Technical facts
  "programming languages": ["JavaScript", "Python", "Java", "C++", "C#", "Ruby", "Go", "Swift", "PHP", "Rust"],
  "internet protocols": ["HTTP", "HTTPS", "FTP", "SMTP", "SSH", "TCP/IP", "UDP"]
};

// Common logical contradictions to detect
const LOGICAL_CONTRADICTIONS = [
  { pattern: /both true and false/, explanation: "Something cannot be both true and false simultaneously" },
  { pattern: /simultaneously [a-z]+ and not [a-z]+/, explanation: "Contradictory states detected" },
  { pattern: /all [a-z]+ are [a-z]+.+no [a-z]+ are [a-z]+/, explanation: "Contradictory universal statements" },
  { pattern: /impossible to [a-z]+ but can [a-z]+/, explanation: "Contradictory possibility statements" }
];

// Expanded keywords for toxicity detection
const TOXIC_PATTERNS = {
  harassment: ["harass", "bully", "intimidate", "stalk", "threaten", "insult", "mock", "ridicule", "humiliate", "embarrass"],
  violence: ["kill", "hurt", "harm", "attack", "destroy", "violent", "weapon", "murder"],
  hateSpeech: ["hate", "racist", "bigot", "sexist", "discriminate", "slur", "stereotype"],
  selfHarm: ["suicide", "self-harm", "kill myself", "hurt myself", "end my life"],
  sexualContent: ["explicit", "pornography", "sexual", "obscene", "lewd", "erotic"],
  illegalActivity: ["hack", "steal", "illegal", "crime", "drug", "fraud", "scam", "cheat"],
  manipulation: ["manipulate", "make someone feel bad", "hurt feelings", "emotional abuse", "gaslight", "make fun of", "appearance", 
                 "angry email", "mean message", "hostile communication", "rude response", "nasty letter", "confrontational", "intimidate", 
                 "angry at", "furious with", "upset with", "make look incompetent", "make look bad", "make someone look stupid", 
                 "expressing frustration", "let them know I'm angry", "show how upset I am", "make them feel bad"]
};

/**
 * Guardrails class providing LLM safety features
 */
class Guardrails {
  constructor() {
    // Configure toxicity thresholds
    this.toxicityThreshold = 0.7;
    this.hallucinationThreshold = 0.6;
    
    // Load default configuration
    this.config = {
      enableInputValidation: true,
      enableOutputValidation: true,
      enableHallucinationDetection: true,
      enableToxicityChecks: true,
      enablePiiProtection: true,
      enableLogicalChecks: true,
      logValidationResults: true,
      strictMode: false // When true, applies more stringent validation
    };
    
    // Initialize factual knowledge database for hallucination detection
    this._knownFactPatterns = this._generateFactPatterns();
  }
  
  /**
   * Configure guardrails settings
   * @param {Object} config - Configuration settings
   */
  configure(config) {
    this.config = { ...this.config, ...config };
  }
  
  /**
   * Validate input before sending to LLM
   * @param {string} input - User input text
   * @returns {Object} Validation result with issues and status
   */
  async validateInput(input) {
    if (!this.config.enableInputValidation) {
      return { valid: true, issues: [] };
    }
    
    const issues = [];
    let valid = true;
    
    // Check for toxicity
    if (this.config.enableToxicityChecks) {
      const toxicityResult = this._checkToxicity(input);
      if (!toxicityResult.valid) {
        issues.push({
          type: 'toxicity',
          severity: 'high',
          details: toxicityResult.details,
          indicators: toxicityResult.indicators
        });
        valid = false;
      }
    }
    
    // Check for PII
    if (this.config.enablePiiProtection) {
      const piiResult = this._detectPII(input);        if (piiResult.hasPII) {
          issues.push({
            type: 'pii',
            severity: 'high',
            details: `Detected potential PII: ${piiResult.detectedTypes.join(', ')}`,
            detectedTypes: piiResult.detectedTypes,
            matches: piiResult.matches
          });
          valid = false;
        }
    }
    
    // Check for logical contradictions
    if (this.config.enableLogicalChecks) {
      const contradictionResult = this._checkLogicalContradictions(input);
      if (contradictionResult.hasContradiction) {
        issues.push({
          type: 'logical_contradiction',
          severity: 'medium',
          details: contradictionResult.details
        });
        // Don't invalidate input just for logical contradictions
      }
    }
    
    // Log validation results if enabled
    if (this.config.logValidationResults) {
      console.log('Input validation result:', JSON.stringify({
        valid,
        issueCount: issues.length,
        issueTypes: issues.map(i => i.type)
      }, null, 2));
    }
    
    return { valid, issues };
  }
  
  /**
   * Validate and sanitize LLM output
   * @param {string} output - LLM generated content
   * @param {string} prompt - Original prompt for context
   * @returns {Object} Validation and sanitized content
   */
  async validateOutput(output, prompt) {
    if (!this.config.enableOutputValidation) {
      return { valid: true, sanitized: output, issues: [] };
    }
    
    const issues = [];
    let valid = true;
    let sanitized = output;
    
    // Check for hallucinations
    if (this.config.enableHallucinationDetection) {
      const hallucinationResult = this._detectHallucination(output, prompt);
      if (hallucinationResult.hasHallucination) {
        issues.push({
          type: 'hallucination',
          severity: 'medium',
          details: hallucinationResult.details,
          confidence: hallucinationResult.confidence,
          segments: hallucinationResult.segments
        });
        
        // Mark hallucinated statements
        sanitized = this._markHallucinations(sanitized, hallucinationResult.segments);
      }
    }
    
    // Check for toxicity in response
    if (this.config.enableToxicityChecks) {
      const toxicityResult = this._checkToxicity(output);
      if (!toxicityResult.valid) {
        issues.push({
          type: 'toxicity',
          severity: 'high',
          details: toxicityResult.details,
          indicators: toxicityResult.indicators
        });
        valid = false;
        
        // Sanitize toxic content
        sanitized = this._sanitizeToxicity(sanitized);
      }
    }
    
    // Check for PII leakage in response
    if (this.config.enablePiiProtection) {
      const piiResult = this._detectPII(output);
      if (piiResult.hasPII) {
        issues.push({
          type: 'pii',
          severity: 'high',
          details: `Found potential PII in response: ${piiResult.detectedTypes.join(', ')}`,
          matches: piiResult.matches
        });
        
        // Redact PII
        sanitized = this._redactPII(sanitized, piiResult.matches);
      }
    }
    
    // Check for logical contradictions
    if (this.config.enableLogicalChecks) {
      const contradictionResult = this._checkLogicalContradictions(output);
      if (contradictionResult.hasContradiction) {
        issues.push({
          type: 'logical_contradiction',
          severity: 'medium',
          details: contradictionResult.details
        });
      }
    }
    
    // Log validation results if enabled
    if (this.config.logValidationResults) {
      console.log('Output validation result:', JSON.stringify({
        valid,
        issueCount: issues.length,
        issueTypes: issues.map(i => i.type)
      }, null, 2));
    }
    
    return { valid, sanitized, issues };
  }
  
  /**
   * Check content for toxicity
   * @param {string} text - Text to analyze
   * @returns {Object} Toxicity check result
   * @private
   */
  _checkToxicity(text) {
    // Skip toxicity check for technical/development-related questions
    const developmentContextPatterns = [
      /\b(laptop|computer|pc|desktop|hardware|specs|specifications)\b/i,
      /\b(development|programming|coding|software|developer)\b/i,
      /\b(vscode|visual studio code|editor|ide|vs code)\b/i,
      /\b(python|javascript|typescript|node.js|nodejs|mongodb|postgresql|sql|database)\b/i,
      /\b(minimum requirements|system requirements|recommended specs)\b/i,
      /\b(github|git|repo|repository|version control)\b/i,
      /\b(ai|artificial intelligence|llm|language model|ml|machine learning)\b/i,
      /\b(windows|linux|macos|operating system|os)\b/i
    ];
    
    // If text strongly indicates a development/technical context, skip toxicity checks
    const isDevelopmentContext = developmentContextPatterns.some(pattern => pattern.test(text));
    let matchCount = 0;
    if (isDevelopmentContext) {
      // Count how many technical patterns match to confirm it's definitely about development
      matchCount = developmentContextPatterns.filter(pattern => pattern.test(text)).length;
      if (matchCount >= 2) {
        return {
          valid: true,
          details: '',
          indicators: {
            profanity: false,
            toxicCategories: {},
            negativeEmotions: [],
            threats: [],
            harmfulIntent: false,
            targetedNegative: false,
            negativeExpression: false
          }
        };
      }
    }
    
    // Basic profanity check using bad-words
    const isProfane = badWordsFilter.isProfane(text);
    
    // Use compromise for more nuanced content analysis
    const doc = nlp(text);
    
    // Check for toxic patterns by category
    const toxicMatches = {};
    let hasToxicContent = false;
    
    for (const [category, patterns] of Object.entries(TOXIC_PATTERNS)) {
      const matchedTerms = [];
      
      patterns.forEach(pattern => {
        // More precise matching to avoid false positives
        // Check for word boundaries or use RegExp for more complex patterns
        const lowerText = text.toLowerCase();
        const lowerPattern = pattern.toLowerCase();
        
        // For single word patterns, check with word boundaries
        if (!lowerPattern.includes(" ")) {
          const wordBoundaryRegex = new RegExp(`\\b${lowerPattern}\\b`, 'i');
          if (wordBoundaryRegex.test(lowerText)) {
            matchedTerms.push(pattern);
            hasToxicContent = true;
          }
        }
        // For multi-word patterns, use simple includes
        else if (lowerText.includes(lowerPattern)) {
          matchedTerms.push(pattern);
          hasToxicContent = true;
        }
      });
      
      if (matchedTerms.length > 0) {
        toxicMatches[category] = matchedTerms;
      }
    }
    
    // Additional checks for negative sentiment
    const negativeEmotions = doc.match('(hate|kill|terrible|awful|horrible)').out('array');
    const threatPatterns = doc.match('(threaten|attack|hurt|harm)').out('array');
    
    // Check for targeted negative language (e.g., "to my neighbor")
    const targetedNegativePattern = /(angry|mean|rude|hostile|aggressive|nasty|insulting|threatening|intimidating|upset with|frustrated (with|by)|disappointed in) (email|letter|message|note|text|communication|conversation) (to|with) (my|the|a|an) (neighbor|boss|coworker|colleague|friend|family|spouse|wife|husband|partner|ex|teacher|customer|client)/i;
    
    // Additional pattern for "expressing negative emotions" about someone
    const expressingNegativePattern = /(express|expressing|convey|tell|inform|let them know|write|writing|draft|drafting|help me write|help me draft) (how|my) (angry|upset|mad|furious|annoyed|irritated|frustrated) (I am|I'm|I feel|about) (with|about|regarding|concerning) (my|the|a|an|their) (neighbor|boss|coworker|colleague|friend|family|spouse|wife|husband|partner|ex|teacher|customer|client|behavior)/i;
    
    // Pattern for general negative expressions about someone's behavior
    const behaviorNegativePattern = /(write|draft|compose|create|help me write) (a|an)? (letter|email|message|note) (to|for) (my|the|a|an) (neighbor|boss|coworker|colleague|friend|family|spouse|wife|husband|partner|ex|teacher|customer|client) (expressing|about|regarding|concerning) (how|my) (upset|angry|mad|furious|annoyed|irritated|frustrated|disappointed) (I am|I'm|I feel)/i;
    
    const hasTargetedNegative = targetedNegativePattern.test(text) || expressingNegativePattern.test(text) || behaviorNegativePattern.test(text);
    
    if (hasTargetedNegative) {
      if (!toxicMatches.manipulation) {
        toxicMatches.manipulation = ["targeted negative communication"];
      } else {
        toxicMatches.manipulation.push("targeted negative communication");
      }
      hasToxicContent = true;
    }      // Check for harmful intent patterns (like "how to make someone...")
    const harmfulIntentPatterns = [
      /how to (make|get) (someone|people|others|them) (feel|look|seem) (bad|ugly|insecure|sad|depressed|anxious)/i,
      /ways to (hurt|harm|damage|mock|insult|ridicule) (someone|people|others)/i,
      /how (can|do) I (make|get) (someone|people|others) (feel|look) (bad|ugly|insecure)/i,
      /tell me (about|how to) (criticize|mock|insult|humiliate)/i,
      // Enhanced patterns for angry/negative communications
      /write (an|a) (angry|mean|threatening|intimidating|hostile|aggressive|nasty|rude|insulting|furious|harsh|unkind|confrontational)/i,
      /help me (write|draft|compose) (an|a) (angry|mean|threatening|intimidating|hostile|aggressive|nasty|rude|insulting|furious|harsh|unkind|confrontational)/i,
      /(write|draft|compose|create) (an|a) (angry|mean|threatening|intimidating|hostile|aggressive|nasty|rude|insulting|furious|harsh|unkind|confrontational) (email|letter|message|note|text|communication|response|reply)( to| for| about)/i,
      /(angry|mean|threatening|intimidating|hostile|aggressive|nasty|rude|insulting|furious|harsh|unkind|confrontational) (email|letter|message|note|text|communication|response|reply)( to| for| about)/i,
      // Subtle harmful patterns
      /(ways|how) to make (my|a|an|the|someone's) (colleague|coworker|boss|friend|neighbor|employee|manager|peer) (look|seem|appear) (bad|incompetent|stupid|foolish|unqualified|wrong|inferior|inadequate)/i,
      /(how|ways) (can|to) (make|get|have|ensure) (my|a|an|the) (colleague|coworker|boss|friend|neighbor|employee|manager|peer) (look|seem|appear) (bad|incompetent|stupid|foolish|unqualified|wrong|inferior|inadequate)/i,
      /(help|need) (me|tips|advice) (to|on) (make|getting) (my|a|an|the|someone) (look|seem|appear) (bad|incompetent|stupid|foolish|unqualified|wrong|inferior|inadequate)/i,
      /(make|get) (my|a|an|the|someone) (colleague|coworker|boss|friend|neighbor|employee|manager|peer) (look|seem|appear) (bad|incompetent|stupid|foolish|unqualified|wrong|inferior|inadequate)/i,
      // Direct patterns for "make colleague look incompetent"
      /make (my|a|an|the) (colleague|coworker|boss|employee|manager|peer) look (bad|incompetent|stupid|foolish)/i,
      /(what|ways|how) (are|to|can i) make (my|a|an|the) (colleague|coworker|boss|employee|manager) look (incompetent|stupid|foolish|bad)/i
    ];
    
    // Exclude technical contexts when checking for harmful intent
    let hasHarmfulIntent = false;
    if (!isDevelopmentContext || matchCount < 2) {
      hasHarmfulIntent = harmfulIntentPatterns.some(pattern => pattern.test(text));
    }
    if (hasHarmfulIntent) {
      if (!toxicMatches.manipulation) {
        toxicMatches.manipulation = ["harmful intent detected"];
      }
      hasToxicContent = true;
    }
    
    // Additional negative expression patterns
    const negativeExpressionPattern = /(upset|angry|mad|frustrated|annoyed|irritated) (with|about|at) (their|his|her|your|the) (behavior|actions|attitude|conduct|work|performance)/i;
    const hasNegativeExpression = negativeExpressionPattern.test(text);
    
    if (hasNegativeExpression) {
      if (!toxicMatches.manipulation) {
        toxicMatches.manipulation = ["negative expression about someone"];
      } else {
        toxicMatches.manipulation.push("negative expression about someone");
      }
      hasToxicContent = true;
    }
    
    // Determine if content is toxic based on profanity and negative patterns
    const isToxic = isProfane || 
                   hasToxicContent ||
                   hasHarmfulIntent ||
                   hasTargetedNegative ||
                   hasNegativeExpression ||
                   (negativeEmotions.length > 2) || 
                   (threatPatterns.length > 0);
    
    return {
      valid: !isToxic,
      details: isToxic ? 'Content contains potentially harmful or inappropriate language' : '',
      indicators: {
        profanity: isProfane,
        toxicCategories: toxicMatches,
        negativeEmotions: negativeEmotions,
        threats: threatPatterns,
        harmfulIntent: hasHarmfulIntent,
        targetedNegative: hasTargetedNegative,
        negativeExpression: hasNegativeExpression
      }
    };
  }
  
  /**
   * Detect personally identifiable information (PII)
   * @param {string} text - Text to analyze
   * @returns {Object} PII detection result
   * @private
   */
  _detectPII(text) {
    const matches = {};
    const detectedTypes = [];
    let hasPII = false;
    
    if (!text) {
      return { hasPII: false, detectedTypes: [], matches: {} };
    }
    
    // Check for each PII pattern
    for (const [type, pattern] of Object.entries(PII_PATTERNS)) {
      const found = text.match(pattern);
      if (found) {
        matches[type] = found;
        detectedTypes.push(type);
        hasPII = true;
      }
    }
    
    // Use NLP for name detection
    try {
      const doc = nlp(text);
      const names = doc.people().out('array');
      if (names && names.length > 0) {
        // Filter out common product names and technical terms that are falsely detected as names
        const techTerms = [
          'gemini', 'claude', 'github', 'mongodb', 'postgresql', 'vscode', 'code assist', 
          'windsurf', 'kilo', 'roo', 'python', 'node.js', 'nodejs', 'windows'
        ];
        
        const filteredNames = names.filter(name => {
          const lowerName = name.toLowerCase();
          return !techTerms.some(term => lowerName.includes(term.toLowerCase()));
        });
        
        if (filteredNames.length > 0) {
          matches.names = filteredNames;
          detectedTypes.push('names');
          hasPII = true;
        }
      }
      
      // Check for locations (potential PII)
      const places = doc.places().out('array');
      if (places && places.length > 0 && this.config.strictMode) {
        // Only flag locations in strict mode as they're often not PII
        matches.locations = places;
        detectedTypes.push('locations');
        hasPII = true;
      }
    } catch (error) {
      console.error('Error in NLP processing for PII detection:', error);
    }
    
    return { hasPII, detectedTypes: detectedTypes || [], matches: matches || {} };
  }
  
  /**
   * Generate fact patterns for hallucination detection
   * @returns {Array} Array of fact patterns for checking
   * @private
   */
  _generateFactPatterns() {
    const patterns = [];
    
    // Add patterns for historical events
    for (const [event, data] of Object.entries(FACTUAL_KNOWLEDGE)) {
      if (typeof data === 'object' && !Array.isArray(data) && data.startYear) {
        patterns.push({
          subject: event.toLowerCase(),
          property: 'year',
          check: (text) => {
            const yearRegex = /\b(1[0-9]{3}|20[0-2][0-9])\b/g;
            const years = [];
            let match;
            while ((match = yearRegex.exec(text)) !== null) {
              const year = parseInt(match[0]);
              if (year < data.startYear - 5 || year > data.endYear + 5) {
                return {
                  isCorrect: false,
                  details: `Incorrect time period for ${event}: mentioned ${year} but actually ${data.startYear}-${data.endYear}`
                };
              }
            }
            return { isCorrect: true };
          }
        });
      }
    }
    
    // Add patterns for scientific facts
    for (const [subject, properties] of Object.entries(FACTUAL_KNOWLEDGE)) {
      if (typeof properties === 'object' && !Array.isArray(properties)) {
        for (const [property, value] of Object.entries(properties)) {
          if (typeof value === 'string' || typeof value === 'number') {
            patterns.push({
              subject: subject.toLowerCase(),
              property: property.toLowerCase(),
              check: (text) => {
                if (text.toLowerCase().includes(`${subject.toLowerCase()} ${property.toLowerCase()}`)) {
                  const valueStr = String(value).toLowerCase();
                  if (!text.toLowerCase().includes(valueStr)) {
                    return {
                      isCorrect: false,
                      details: `Contradicts known fact: ${subject}'s ${property} is ${value}`
                    };
                  }
                }
                return { isCorrect: true };
              }
            });
          }
        }
      }
    }
    
    return patterns;
  }
  
  /**
   * Check text for logical contradictions
   * @param {string} text - Text to analyze
   * @returns {Object} Contradiction check result
   * @private
   */
  _checkLogicalContradictions(text) {
    const lowerText = text.toLowerCase();
    let hasContradiction = false;
    const details = [];
    
    // Check for logical contradictions using patterns
    for (const contradiction of LOGICAL_CONTRADICTIONS) {
      if (contradiction.pattern.test(lowerText)) {
        hasContradiction = true;
        details.push(contradiction.explanation);
      }
    }
    
    // Check for contradictory statements within the text
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    // Analyze pairs of sentences for contradictions
    for (let i = 0; i < sentences.length; i++) {
      for (let j = i + 1; j < sentences.length; j++) {
        const result = this._analyzeSentencePair(sentences[i], sentences[j]);
        if (result.isContradictory) {
          hasContradiction = true;
          details.push(result.reason);
        }
      }
    }
    
    return { hasContradiction, details: details.join('; ') };
  }
  
  /**
   * Analyze a pair of sentences for contradictions
   * @param {string} sentence1 - First sentence
   * @param {string} sentence2 - Second sentence
   * @returns {Object} Analysis result
   * @private
   */
  _analyzeSentencePair(sentence1, sentence2) {
    // Very basic contradiction detection
    // Check for direct negation
    const s1 = sentence1.toLowerCase().trim();
    const s2 = sentence2.toLowerCase().trim();
    
    // If one sentence contains "always" and the other "never" with similar context
    if ((s1.includes('always') && s2.includes('never')) ||
        (s1.includes('never') && s2.includes('always'))) {
      const s1Words = s1.split(/\s+/);
      const s2Words = s2.split(/\s+/);
      
      // Calculate word overlap
      const commonWords = s1Words.filter(word => 
        s2Words.includes(word) && 
        word.length > 3 && 
        !['always', 'never', 'the', 'and', 'that', 'this', 'with', 'from'].includes(word)
      );
      
      if (commonWords.length >= 2) {
        return {
          isContradictory: true,
          reason: `Contradictory statements about: ${commonWords.join(', ')}`
        };
      }
    }
    
    // Check for statements that directly contradict (A is B vs A is not B)
    const doc1 = nlp(s1);
    const doc2 = nlp(s2);
    
    const subjects1 = doc1.nouns().out('array');
    const subjects2 = doc2.nouns().out('array');
    
    // Look for common subjects with opposite assertions
    const commonSubjects = subjects1.filter(subj => subjects2.includes(subj));
    
    for (const subject of commonSubjects) {
      if ((s1.includes(`${subject} is`) && s2.includes(`${subject} is not`)) ||
          (s1.includes(`${subject} is not`) && s2.includes(`${subject} is`))) {
        return {
          isContradictory: true,
          reason: `Contradictory statements about "${subject}"`
        };
      }
    }
    
    return { isContradictory: false };
  }
  
  /**
   * Detect potential hallucinations in LLM output
   * @param {string} output - LLM generated text
   * @param {string} prompt - Original prompt for context
   * @returns {Object} Hallucination detection result
   * @private
   */
  _detectHallucination(output, prompt) {
    const segments = [];
    let hasHallucination = false;
    const details = [];
    
    // Break output into sentences for analysis
    const sentences = output.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i].trim();
      
      // Skip short sentences (less likely to contain factual claims)
      if (sentence.length < 10) continue;
      
      // Check for factual contradictions
      const contradictionCheck = this._checkFactualContradictions(sentence);
      
      if (contradictionCheck.hasContradiction) {
        hasHallucination = true;
        details.push(contradictionCheck.details);
                    
        segments.push({
          text: sentence,
          index: output.indexOf(sentence),
          length: sentence.length,
          reason: contradictionCheck.details,
          confidence: 0.9 // High confidence for direct factual contradictions
        });
      }
      
      // Simple heuristic for detecting hallucinations - check for definitive statements about uncertain topics
      if (this._containsDefinitiveClaimsAboutUncertainTopics(sentence)) {
        hasHallucination = true;
        const reason = 'Contains definitive claims about uncertain topics';
        details.push(reason);
        
        segments.push({
          text: sentence,
          index: output.indexOf(sentence),
          length: sentence.length,
          reason: reason,
          confidence: 0.7
        });
      }
    }
    
    return { 
      hasHallucination, 
      details: details.join('; '), 
      segments,
      confidence: hasHallucination ? 0.8 : 0
    };
  }
  
  /**
   * Check if text contains definitive claims about uncertain topics
   * @param {string} text - Text to analyze
   * @returns {boolean} Whether the text contains definitive claims about uncertain topics
   * @private
   */
  _containsDefinitiveClaimsAboutUncertainTopics(text) {
    const lowerText = text.toLowerCase();
    
    // Definitive language patterns
    const definitivePatterns = [
      'is definitely', 'absolutely', 'certainly', 'undoubtedly', 'without question',
      'is the only', 'will always', 'never', 'is guaranteed to', 'is impossible',
      'all of the', 'none of the', 'everyone', 'nobody'
    ];
    
    // Uncertain topics
    const uncertainTopics = [
      'future', 'prediction', 'forecast', 'will happen', 'will occur',
      'market', 'stock', 'investment', 'trend', 'politics', 'election',
      'climate change', 'global warming', 'pandemic', 'medicine', 'cure',
      'artificial intelligence', 'technology advancement', 'scientific breakthrough'
    ];
    
    // Check if the text contains both definitive language and references to uncertain topics
    const hasDefinitiveLanguage = definitivePatterns.some(pattern => lowerText.includes(pattern));
    const hasUncertainTopic = uncertainTopics.some(topic => lowerText.includes(topic));
    
    return hasDefinitiveLanguage && hasUncertainTopic;
  }
  
  /**
   * Check text for contradictions with known facts
   * @param {string} text - Text to analyze
   * @returns {Object} Contradiction check result
   * @private
   */
  _checkFactualContradictions(text) {
    const lowerText = text.toLowerCase();
    let hasContradiction = false;
    const details = [];
    
    // Check against our known fact patterns
    for (const pattern of this._knownFactPatterns) {
      if (lowerText.includes(pattern.subject) && lowerText.includes(pattern.property)) {
        const result = pattern.check(text);
        if (!result.isCorrect) {
          hasContradiction = true;
          details.push(result.details);
        }
      }
    }
    
    // Additional check for geographic facts
    for (const [category, items] of Object.entries(FACTUAL_KNOWLEDGE)) {
      if (Array.isArray(items) && lowerText.includes(category.toLowerCase())) {
        const categoryRegex = new RegExp(`([\\w\\s]+) is a ${category.slice(0, -1)}`, 'i');
        const match = lowerText.match(categoryRegex);
        
        if (match) {
          const mentionedItem = match[1].trim().toLowerCase();
          const isInCategory = items.some(item => item.toLowerCase() === mentionedItem);
          
          if (!isInCategory) {
            hasContradiction = true;
            details.push(`Incorrect categorization: ${match[1]} is not a ${category.slice(0, -1)}`);
          }
        }
      }
    }
    
    return { hasContradiction, details: details.join('; ') };
  }
  
  /**
   * Mark hallucinated segments in text
   * @param {string} text - Original text
   * @param {Array} segments - Hallucinated segments
   * @returns {string} Text with marked hallucinations
   * @private
   */
  _markHallucinations(text, segments) {
    if (!segments || segments.length === 0) return text;
    
    // Sort segments by index in reverse order to avoid offset issues
    const sortedSegments = [...segments].sort((a, b) => b.index - a.index);
    
    let result = text;
    for (const segment of sortedSegments) {
      const prefix = result.substring(0, segment.index);
      const suffix = result.substring(segment.index + segment.length);
      
      // Add warning emoji and confidence level
      const confidencePercent = Math.round(segment.confidence * 100);
      result = prefix + 
               `⚠️ <span class="hallucination" title="Confidence: ${confidencePercent}%">` + 
               result.substring(segment.index, segment.index + segment.length) + 
               '</span> ⚠️' + 
               suffix;
    }
    
    return result;
  }
  
  /**
   * Sanitize toxic content
   * @param {string} text - Text to sanitize
   * @returns {string} Sanitized text
   * @private
   */
  _sanitizeToxicity(text) {
    // Replace profanity with asterisks
    let sanitized = badWordsFilter.clean(text);
    
    // Additionally sanitize other toxic patterns
    for (const [category, patterns] of Object.entries(TOXIC_PATTERNS)) {
      for (const pattern of patterns) {
        // Replace with asterisks of the same length
        const asterisks = '*'.repeat(pattern.length);
        sanitized = sanitized.replace(new RegExp(pattern, 'gi'), asterisks);
      }
    }
    
    return sanitized;
  }
  
  /**
   * Redact PII from text
   * @param {string} text - Text containing PII
   * @param {Object} matches - PII matches by type
   * @returns {string} Redacted text
   * @private
   */
  _redactPII(text, matches) {
    if (!matches) return text;
    
    let redacted = text;
    
    // Redact each type of PII
    for (const [type, found] of Object.entries(matches)) {
      if (Array.isArray(found)) {
        for (const match of found) {
          const redactText = type === 'names' ? '[NAME REDACTED]' : 
                            type === 'locations' ? '[LOCATION REDACTED]' : 
                            `[${type.toUpperCase()} REDACTED]`;
          
          // Use HTML for highlighting in UI
          const htmlRedact = `<span class="redacted" title="${type}">${redactText}</span>`;
          redacted = redacted.replace(new RegExp(match, 'g'), htmlRedact);
        }
      }
    }
    
    return redacted;
  }
  
  /**
   * Generate fallback response when content fails validation
   * @param {Array} issues - Validation issues
   * @returns {string} Safe fallback response
   */
  generateFallbackResponse(issues) {
    if (!issues || issues.length === 0) {
      return "I apologize, but I cannot generate a response to that prompt.";
    }
    
    const issueTypes = issues.map(issue => issue.type);
    
    if (issueTypes.includes('toxicity')) {
      // Check specific toxicity indicators for more targeted responses
      const toxicIssue = issues.find(issue => issue.type === 'toxicity');
      
      if (toxicIssue?.indicators?.harmfulIntent || toxicIssue?.indicators?.targetedNegative) {
        return "I cannot assist with creating negative or harmful communications directed at others. Instead, I'd be happy to help draft constructive and respectful messages.";
      }
      
      if (toxicIssue?.indicators?.toxicCategories?.manipulation) {
        return "I'm designed to promote positive interactions. I cannot help with content that could be used to manipulate or harm others emotionally.";
      }
      
      if (toxicIssue?.indicators?.toxicCategories?.violence) {
        return "I cannot assist with content that contains or promotes violence. Please let me know if I can help with something constructive instead.";
      }
      
      return "I apologize, but I cannot respond to content that may be harmful or offensive.";
    } else if (issueTypes.includes('pii')) {
      return "I've detected personal information in your request. For privacy and security reasons, please avoid sharing personal data.";
    } else if (issueTypes.includes('hallucination')) {
      return "I need to be careful not to provide potentially inaccurate information. Could you rephrase your question to focus on verified facts?";
    } else if (issueTypes.includes('logical_contradiction')) {
      return "I've detected a potential logical contradiction in your request. Could you please clarify your question?";
    } else {
      return "I'm unable to provide a response to this prompt due to content safety guidelines. Please try a different question.";
    }
  }
}

// Create and export singleton instance
const guardrails = new Guardrails();
export default guardrails;
