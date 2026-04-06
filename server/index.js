require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const dartService = require('./services/dart');
const aiService = require('./services/ai');
const scoringService = require('./services/scoring');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// In-memory storage for jobs and results
const jobs = new Map();
let latestResults = [];

// === Health Check ===
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    dartConfigured: !!process.env.DART_API_KEY,
    openaiConfigured: !!process.env.OPENAI_API_KEY,
  });
});

// === Company Search ===
app.get('/api/companies/search', async (req, res) => {
  try {
    const { q } = req.query;
    const companies = await dartService.searchCompanies(q);
    res.json(companies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// === Company List ===
app.get('/api/companies', async (req, res) => {
  try {
    const { market } = req.query;
    const companies = await dartService.getCompanyList(market);
    res.json(companies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// === Start Screening ===
app.post('/api/screening/start', async (req, res) => {
  try {
    const { corpCodes, market, maxCompanies } = req.body;
    const jobId = uuidv4();

    const job = {
      id: jobId,
      status: 'pending',
      progress: 0,
      totalCompanies: 0,
      processedCompanies: 0,
      results: [],
      startedAt: new Date().toISOString(),
    };

    jobs.set(jobId, job);
    res.json(job);

    // Run screening in background
    runScreening(jobId, corpCodes, market || 'all', maxCompanies || 100);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// === Get Screening Status ===
app.get('/api/screening/status/:jobId', (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  res.json(job);
});

// === Get Latest Results ===
app.get('/api/screening/results', (req, res) => {
  res.json(latestResults);
});

// === Analyze Single Company ===
app.post('/api/analyze', async (req, res) => {
  try {
    const { corpCode } = req.body;
    if (!corpCode) {
      return res.status(400).json({ error: 'corpCode is required' });
    }

    const result = await analyzeCompany(corpCode);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// === Background Screening Process ===
async function runScreening(jobId, corpCodes, market, maxCompanies) {
  const job = jobs.get(jobId);

  try {
    // Step 1: Get company list
    job.status = 'collecting';
    let companies;

    if (corpCodes && corpCodes.length > 0) {
      companies = corpCodes.map(code => ({ corpCode: code }));
    } else {
      companies = await dartService.getCompanyList(market);
    }

    companies = companies.slice(0, maxCompanies);
    job.totalCompanies = companies.length;

    // Step 2: Analyze each company
    job.status = 'analyzing';
    const results = [];

    for (let i = 0; i < companies.length; i++) {
      try {
        const result = await analyzeCompany(companies[i].corpCode || companies[i].corp_code);
        results.push(result);
      } catch (error) {
        console.error(`Failed to analyze ${companies[i].corpCode || companies[i].corp_code}:`, error.message);
      }

      job.processedCompanies = i + 1;
      job.progress = Math.round(((i + 1) / companies.length) * 100);
    }

    // Step 3: Score and rank
    job.status = 'scoring';
    const rankedResults = scoringService.rankResults(results);

    job.results = rankedResults;
    job.status = 'completed';
    job.completedAt = new Date().toISOString();
    latestResults = rankedResults;

  } catch (error) {
    job.status = 'error';
    job.error = error.message;
    console.error('Screening failed:', error);
  }
}

async function analyzeCompany(corpCode) {
  // Step 1: Fetch DART data
  const dartData = await dartService.getCompanyData(corpCode);

  // Step 2: AI Analysis
  const aiResult = await aiService.analyzeWithStructuredOutput(dartData);

  // Step 3: Calculate scores
  const scoreCard = scoringService.calculateScoreCard(
    dartData.company,
    aiResult.metrics,
    aiResult.analysis
  );

  return scoreCard;
}

app.listen(PORT, () => {
  console.log(`AI Stock Screener server running on port ${PORT}`);
  console.log(`DART API configured: ${!!process.env.DART_API_KEY}`);
  console.log(`OpenAI API configured: ${!!process.env.OPENAI_API_KEY}`);
});
